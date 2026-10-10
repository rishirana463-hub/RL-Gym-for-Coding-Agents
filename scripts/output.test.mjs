import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createOutput, parseEvent } from '../evaluation/output.mjs';
import { ServiceInfrastructureError, withService } from '../evaluation/tests/harness.mjs';

test('UTF-8 and JSON events survive arbitrary byte boundaries and final lines', () => {
  const text = '{"event":"ready","port":1234,"note":"café 🌏"}\r\n{"event":"harness_finished"}';
  const lines = [], written = [];
  const output = createOutput({ onLine: line => lines.push(line), onText: chunk => written.push(chunk) });
  for (const byte of Buffer.from(text)) output.write(Buffer.from([byte]));
  assert.equal(lines.length, 1);
  output.end();
  assert.equal(lines.length, 2);
  assert.equal(parseEvent(lines[0]).note, 'café 🌏');
  assert.equal(parseEvent(lines[1]).event, 'harness_finished');
  assert.equal(written.join(''), text);
});

test('completion requires a top-level JSON event, not nested events or text', () => {
  let finished = 0;
  const output = createOutput({ onLine: line => {
    if (parseEvent(line)?.event === 'harness_finished') finished += 1;
  } });
  for (const line of [
    'noise "harness_finished"',
    JSON.stringify({ event: 'trajectory', data: { event: 'harness_finished' } }),
    JSON.stringify({ event: 'trajectory', data: '"harness_finished"' }),
    JSON.stringify({ harness_finished: true }),
    JSON.stringify('harness_finished'),
    'null',
    '[]',
    'prefix {"event":"harness_finished"}'
  ]) output.write(line + '\n');
  assert.equal(finished, 0);
  output.write('{"event":"harness_');
  assert.equal(finished, 0);
  output.write('finished"}\n');
  assert.equal(finished, 1);
  output.end();
});

test('noisy output has bounded diagnostic and incomplete-line memory', () => {
  const lines = [];
  let written = 0;
  const output = createOutput({ tailLimit: 80, lineLimit: 128, onLine: line => lines.push(line), onText: text => { written += text.length; } });
  for (let i = 0; i < 1000; i++) {
    output.write('x'.repeat(8192));
    assert.ok(output.tail.length <= 80);
    assert.ok(output.bufferedLength <= 128);
  }
  const suffix = '{"event":"harness_finished"}\n{"event":"ready","port":42}\n';
  output.write(suffix);
  output.end();
  assert.deepEqual(lines.map(parseEvent), [{ event: 'ready', port: 42 }]);
  assert.equal(written, 8192 * 1000 + suffix.length);
  assert.equal(output.tail.length, 80);
});

test('API keys remain redacted across every chunk boundary', () => {
  const secret = 'sk-test-α-secret';
  const input = `start ${secret}\n${secret}${secret} end`;
  const expected = 'start [REDACTED]\n[REDACTED][REDACTED] end';
  for (let size = 1; size < Buffer.byteLength(secret) + 2; size++) {
    const written = [];
    const output = createOutput({ secret, onText: text => written.push(text) });
    const bytes = Buffer.from(input);
    for (let offset = 0; offset < bytes.length; offset += size) output.write(bytes.subarray(offset, offset + size));
    output.end();
    assert.equal(written.join(''), expected);
    assert.equal(output.tail, expected);
    assert.equal(output.bufferedLength, 0);
  }
});

test('partial key prefixes flush intact and ending is idempotent', () => {
  const chunks = [];
  const output = createOutput({ secret: 'secret', onText: text => chunks.push(text) });
  output.write('prefix secr');
  output.end(); output.end();
  assert.equal(chunks.join(''), 'prefix secr');
  assert.throws(() => output.write('late'), /already ended/);
});

test('service readiness survives split stdout events and large stderr noise', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stockroom-output-test-'));
  try {
    fs.writeFileSync(path.join(directory, 'server.mjs'), `
      import http from 'node:http';
      const server = http.createServer((req, res) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      });
      server.listen(0, '127.0.0.1', () => {
        process.stderr.write('x'.repeat(200000));
        const ready = Buffer.from(JSON.stringify({ event: 'ready', port: server.address().port, note: 'café' }) + '\\n');
        let offset = 0;
        const send = () => {
          if (offset === ready.length) return;
          process.stdout.write(ready.subarray(offset, ++offset));
          setImmediate(send);
        };
        send();
      });
    `);
    await withService({ solution: directory }, async api => {
      assert.deepEqual(await api.raw('/health'), { status: 200, body: { ok: true } });
    });
  } finally {
    const target = fs.realpathSync(directory);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('stockroom-output-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('an unavailable Docker executable is an infrastructure failure', async () => {
  const previous = process.env.PATH;
  try {
    process.env.PATH = '';
    await assert.rejects(withService({ dockerImage: 'stockroom-test:no-run' }, () => {
      assert.fail('A container must not start with Docker unavailable');
    }), error => error instanceof ServiceInfrastructureError && /could not launch/.test(error.message));
  } finally {
    if (previous === undefined) delete process.env.PATH;
    else process.env.PATH = previous;
  }
});
