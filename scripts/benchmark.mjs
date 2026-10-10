import assert from 'node:assert/strict';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { withService } from '../evaluation/tests/harness.mjs';
import { root, sourceHash, write } from '../evaluation/util.mjs';

const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const flag = process.argv[i];
  const value = process.argv[i + 1];
  if (!['--solution', '--out'].includes(flag) || !value || value.startsWith('--') || Object.hasOwn(options, flag)) {
    throw new Error('Usage: node scripts/benchmark.mjs [--solution DIRECTORY] [--out FILE]');
  }
  options[flag] = value;
}

const solution = path.resolve(root, options['--solution'] ?? 'reference');
const out = options['--out'] ?? '.runs/performance.json';
const products = 100;
const orders = 100;
const batches = 7;
const iterations = 100;
const warmups = 20;

await withService({ solution }, async app => {
  for (let i = 0; i < products; i++) {
    await app.receive(100, `product-${String(i).padStart(3, '0')}`, 'benchmark');
  }
  for (let i = 0; i < orders; i++) {
    const items = Array.from({ length: 3 }, (_, offset) => ({
      sku: `product-${String((i + offset) % products).padStart(3, '0')}`, quantity: 2
    }));
    await app.order(items, `order-${String(i).padStart(3, '0')}`, 1000, 'benchmark');
  }

  const readState = async () => {
    const response = await fetch(`${app.url}/v1/state`, { signal: AbortSignal.timeout(5000) });
    return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()) };
  };
  const baseline = await readState();
  assert.equal(baseline.status, 200);
  const expected = JSON.parse(baseline.bytes.toString('utf8'));
  assert.equal(expected.ok, true);
  assert.equal(expected.result.sequence, products + orders);
  assert.equal(expected.result.inventory.length, products);
  assert.equal(expected.result.orders.length, orders);
  const validate = response => {
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.bytes.toString('utf8')), expected, 'Reading state must not change the response');
    assert.equal(response.bytes.length, baseline.bytes.length, 'Response byte count changed');
  };
  for (let i = 0; i < warmups; i++) validate(await readState());

  const elapsed = [];
  for (let batch = 0; batch < batches; batch++) {
    const responses = [];
    const start = performance.now();
    for (let i = 0; i < iterations; i++) responses.push(await readState());
    elapsed.push(performance.now() - start);
    // Validate outside the timed interval so JSON checks do not mask service costs.
    for (const response of responses) validate(response);
  }
  const sorted = [...elapsed].sort((a, b) => a - b);
  const medianMsPerBatch = sorted[Math.floor(sorted.length / 2)];
  const result = {
    generatedAt: new Date().toISOString(), solution, sourceHash: sourceHash(solution),
    runtime: { node: process.version, v8: process.versions.v8, platform: process.platform, arch: process.arch },
    scenario: { products, orders, linesPerOrder: 3, setupCommands: products + orders },
    measurement: 'Sequential GET /v1/state with full body reads; setup, warmup, and JSON validation excluded',
    warmups, batches, iterationsPerBatch: iterations, timedRequests: batches * iterations,
    rawResponseBytes: baseline.bytes.length, batchMilliseconds: elapsed,
    medianMsPerBatch, medianMsPerRequest: medianMsPerBatch / iterations,
    unchangedJsonValidated: true
  };
  write(out, result);
  console.log(JSON.stringify(result, null, 2));
});
