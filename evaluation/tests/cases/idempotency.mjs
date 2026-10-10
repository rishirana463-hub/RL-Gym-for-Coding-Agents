import assert from 'node:assert/strict';
import { items, change, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('D01', 'idempotency', 'Retry receipt returns exact response with one stock/audit effect', async a => {
  const c = { op: 'receive', requestId: 'same', warehouse: 'A', sku: 'widget', quantity: 5 };
  const first = await a.command(c); const before = await a.state();
  assert.deepEqual(await a.command(c), first); assert.deepEqual(await a.state(), before);
});
test('D02', 'idempotency', 'Retry identity ignores nested object key order', async a => {
  await a.receive();
  const c = { op: 'createOrder', requestId: 'same', orderId: 'o1', warehouse: 'A', expiresAt: 10, items: items(3) };
  const first = await a.command(c);
  assert.deepEqual(await a.command({ items: [{ quantity: 3, sku: 'widget' }], expiresAt: 10, warehouse: 'A', orderId: 'o1', requestId: 'same', op: 'createOrder' }), first);
});
test('D03', 'idempotency', 'Global retry keys reject changed payload and changed operation', async a => {
  const c = { op: 'receive', requestId: 'same', warehouse: 'A', sku: 'widget', quantity: 5 }; await a.command(c);
  await unchanged(a, async () => {
    await a.error({ ...c, quantity: 6 }, 'IDEMPOTENCY_CONFLICT');
    await a.error({ op: 'advanceClock', requestId: 'same', now: 0 }, 'IDEMPOTENCY_CONFLICT');
  });
});
test('D04', 'idempotency', 'Array order remains part of retry identity', async a => {
  await a.receive(5, 'a'); await a.receive(5, 'z');
  const c = { op: 'createOrder', requestId: 'same', orderId: 'o1', warehouse: 'A', expiresAt: 10, items: [{ sku: 'a', quantity: 1 }, { sku: 'z', quantity: 1 }] }; await a.command(c);
  await unchanged(a, () => a.error({ ...c, items: [...c.items].reverse() }, 'IDEMPOTENCY_CONFLICT'));
});
test('D05', 'idempotency', 'Rejected requests do not claim retry keys', async a => {
  const c = { op: 'createOrder', requestId: 'retry', orderId: 'o1', warehouse: 'A', expiresAt: 10, items: items(2) };
  await a.error(c, 'INSUFFICIENT_STOCK'); await a.receive(); assert.equal((await a.command(c)).status, 200);
  await a.error({ op: 'receive', requestId: 'fix', warehouse: 'A', sku: 'widget', quantity: 0 }, 'VALIDATION', 400);
  assert.equal((await a.command({ op: 'receive', requestId: 'fix', warehouse: 'A', sku: 'widget', quantity: 1 })).status, 200);
});
test('D06', 'idempotency', 'Replay precedes stale revisions and returns immutable historical snapshots', async a => {
  await a.receive(); await a.order(); const c = { ...change('ship', 1, 1), requestId: 'ship-once' };
  const first = await a.command(c); await a.ok(change('cancel', 2, 3)); await a.ok({ op: 'advanceClock', now: 20 });
  await unchanged(a, async () => { assert.deepEqual(await a.command(c), first); });
  assert.equal(first.body.result.revision, 2); assert.equal(first.body.result.lines[0].reserved, 3);
});
test('D07', 'idempotency', 'Validation precedes replay lookup', async a => {
  const c = { op: 'receive', requestId: 'same', warehouse: 'A', sku: 'widget', quantity: 2 }; await a.command(c);
  await unchanged(a, () => a.error({ ...c, extra: 1 }, 'VALIDATION', 400));
});
test('D08', 'idempotency', 'Audit contains one ordered event per successful command only', async a => {
  const c = { op: 'receive', requestId: 'r1', warehouse: 'A', sku: 'widget', quantity: 2 };
  await a.command(c); await a.command(c); await a.error(change('ship', 1, 1), 'NOT_FOUND', 404);
  await a.ok({ op: 'advanceClock', requestId: 'r2', now: 3 });
  assert.deepEqual((await a.state()).audit, [{ sequence: 1, requestId: 'r1', op: 'receive', now: 0 }, { sequence: 2, requestId: 'r2', op: 'advanceClock', now: 3 }]);
});
