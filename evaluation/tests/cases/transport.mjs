import assert from 'node:assert/strict';
import { items, change, move, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('T01', 'transport', 'Health, exact empty state, and read purity', async a => {
  assert.deepEqual(await a.raw('/health'), { status: 200, body: { ok: true } });
  const empty = { now: 0, sequence: 0, inventory: [], orders: [], transfers: [], audit: [] };
  assert.deepEqual(await a.state(), empty); assert.deepEqual(await a.state(), empty);
});
test('T02', 'transport', 'Unknown paths and methods are 404', async a => {
  for (const [url, method] of [['/missing', 'GET'], ['/health', 'POST'], ['/v1/commands', 'GET'], ['/v1/state', 'DELETE']]) {
    assert.deepEqual(await a.raw(url, { method }), { status: 404, body: { ok: false, error: { code: 'NOT_FOUND' } } });
  }
});
test('T03', 'transport', 'Malformed JSON and non-object bodies are rejected atomically', async a => {
  await unchanged(a, async () => {
    for (const body of ['{', 'null', '[]', '42', '"x"']) {
      const r = await a.raw('/v1/commands', { method: 'POST', body }); assert.equal(r.status, 400); assert.equal(r.body.error.code, 'VALIDATION');
    }
  });
});
test('T04', 'transport', 'Unknown operations, missing and extra fields are invalid', async a => {
  const c = { op: 'receive', warehouse: 'A', sku: 'widget', quantity: 2 };
  await unchanged(a, async () => {
    await a.error({ ...c, extra: 1 }, 'VALIDATION', 400);
    await a.error({ op: 'receive' }, 'VALIDATION', 400);
    await a.error({ op: 'constructor' }, 'VALIDATION', 400);
  });
});
test('T05', 'transport', 'Identifier boundaries, case sensitivity and object-like names', async a => {
  for (const sku of ['constructor', 'toString', 'X'.repeat(64), 'x', 'X']) await a.receive(1, sku);
  assert.equal((await a.state()).inventory.length, 5);
  for (const sku of ['', '_bad', '../x', 'X'.repeat(65), 'é', 123]) await a.error({ op: 'receive', warehouse: 'A', sku, quantity: 1 }, 'VALIDATION', 400);
});
test('T06', 'transport', 'Quantity and timestamp type/range boundaries', async a => {
  for (const quantity of [0, -1, 1.5, '1', true, null, 1_000_000_001]) await a.error({ op: 'receive', warehouse: 'A', sku: 'widget', quantity }, 'VALIDATION', 400);
  for (const now of [-1, 0.5, '1', 9_000_000_000_001]) await a.error({ op: 'advanceClock', now }, 'VALIDATION', 400);
  await a.ok({ op: 'advanceClock', now: 9_000_000_000_000 });
});
test('T07', 'transport', 'Item-list shape, duplicates, extra fields and size are validated', async a => {
  await a.receive();
  const c = { op: 'createOrder', orderId: 'o1', warehouse: 'A', expiresAt: 10 };
  await unchanged(a, async () => {
    for (const list of [[], {}, items(0), [{ sku: 'widget', quantity: 1, other: 2 }], [...items(1), ...items(2)], Array.from({ length: 101 }, (_, i) => ({ sku: `s${i}`, quantity: 1 }))]) await a.error({ ...c, items: list }, 'VALIDATION', 400);
  });
});
test('T08', 'transport', 'Missing entities and invalid revisions have specified precedence', async a => {
  await a.error(change('ship', 1, 1), 'NOT_FOUND', 404);
  await a.error(move('receiveTransfer', 1, 1), 'NOT_FOUND', 404);
  for (const ifRevision of [0, -1, 1.2, '1', null]) await a.error(change('ship', ifRevision, 1), 'VALIDATION', 400);
});
