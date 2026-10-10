import assert from 'node:assert/strict';

const base = process.env.STOCKROOM_URL ?? 'http://127.0.0.1:3000';
const health = await fetch(`${base}/health`);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { ok: true });
const state = await fetch(`${base}/v1/state`);
assert.equal(state.status, 200);
const body = await state.json();
assert.equal(body.ok, true);
assert.ok(Array.isArray(body.result.inventory));
console.log('Public smoke checks passed. Use a fresh DATA_DIR for manual examples.');
