import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { withService } from '../evaluation/tests/harness.mjs';
import { root } from '../evaluation/util.mjs';
import { validateDeterminismEvidence } from '../evaluation/evidence.mjs';

test('aborting a partially uploaded command leaves the service alive and state untouched', async () => {
  await withService({ solution: path.join(root, 'reference') }, async api => {
    await api.receive(3);
    const before = await api.state();
    const observed = await api.raw('/health'); assert.equal(observed.status, 200);
    // The health response does not expose the selected address; use the harness URL accessor.
    const request = http.request(`${api.url}/v1/commands`, { method: 'POST', headers: { 'content-length': 400 } });
    request.on('error', () => {});
    request.write('{"op":"receive",');
    await delay(40);
    request.destroy();
    await delay(40);
    assert.deepEqual(await api.state(), before);
    await api.receive(2);
  });
});

test('determinism evidence rejects empty, partial, failed, and stale repetitions', () => {
  const expected = { checks: 56, solutionHash: 'source', checkHash: 'verifier' };
  const run = { score: 1, total: 56, passed: 56, solutionHash: 'source', checkHash: 'verifier' };
  const report = { stable: true, execution: 'docker', repetitions: 3, runs: [run, run, run] };
  assert.doesNotThrow(() => validateDeterminismEvidence(report, expected));
  for (const invalid of [
    { ...report, runs: [] }, { ...report, runs: [run] },
    { ...report, runs: [run, run, { ...run, score: 0 }] },
    { ...report, runs: [run, run, { ...run, passed: 55 }] },
    { ...report, runs: [run, run, { ...run, checkHash: 'old' }] }
  ]) assert.throws(() => validateDeterminismEvidence(invalid, expected));
});
