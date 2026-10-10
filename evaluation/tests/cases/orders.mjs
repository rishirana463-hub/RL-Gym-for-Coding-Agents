import assert from 'node:assert/strict';
import { items, change, row, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('O01', 'orders', 'Multi-SKU reservation rolls back an earlier successful line', async a => {
  await a.receive(5, 'a'); await a.receive(1, 'z');
  await unchanged(a, () => a.error({ op: 'createOrder', orderId: 'o1', warehouse: 'A', expiresAt: 10, items: [{ sku: 'a', quantity: 3 }, { sku: 'z', quantity: 2 }] }, 'INSUFFICIENT_STOCK'));
});
test('O02', 'orders', 'Partial shipment, cancellation and closure preserve line totals', async a => {
  await a.receive(); await a.order();
  await a.ok(change('ship', 1, 2)); const c = await a.ok(change('cancel', 2, 2));
  assert.equal(c.result.status, 'CLOSED'); assert.equal(c.result.revision, 3);
  assert.deepEqual(c.result.lines, [{ sku: 'widget', quantity: 4, reserved: 0, shipped: 2, cancelled: 2, returned: 0 }]);
});
test('O03', 'orders', 'Closed IDs cannot be reused and duplicate detection precedes expiry', async a => {
  await a.receive(); await a.order(); await a.ok(change('cancel', 1, 4));
  await unchanged(a, () => a.error({ op: 'createOrder', orderId: 'o1', warehouse: 'A', expiresAt: 0, items: items(1) }, 'ALREADY_EXISTS'));
});
test('O04', 'orders', 'Stale revisions reject shipments, cancellations and returns', async a => {
  await a.receive(); await a.order(); await a.ok(change('ship', 1, 1));
  await unchanged(a, async () => { for (const op of ['ship', 'cancel', 'return']) await a.error(change(op, 1, 100), 'STALE_REVISION'); });
});
test('O05', 'orders', 'Unknown and excess line quantities fail atomically', async a => {
  await a.receive(5, 'a'); await a.receive(5, 'z'); await a.order([{ sku: 'a', quantity: 3 }, { sku: 'z', quantity: 2 }]);
  await unchanged(a, async () => {
    await a.error({ op: 'ship', orderId: 'o1', ifRevision: 1, items: [{ sku: 'a', quantity: 1 }, { sku: 'z', quantity: 3 }] }, 'INVALID_QUANTITY');
    await a.error({ op: 'cancel', orderId: 'o1', ifRevision: 1, items: items(1, 'missing') }, 'INVALID_QUANTITY');
  });
});
test('O06', 'orders', 'Partial returns restore original warehouse without reopening orders', async a => {
  await a.receive(); await a.order(); await a.ok(change('ship', 1, 4));
  const r = await a.ok(change('return', 2, 2)); assert.equal(r.result.status, 'CLOSED'); assert.equal(r.result.lines[0].shipped, 4); assert.equal(r.result.lines[0].returned, 2);
  assert.equal(row(await a.state()).onHand, 8);
});
test('O07', 'orders', 'Cumulative returns cannot exceed shipments or include cancelled stock', async a => {
  await a.receive(); await a.order(); await a.ok(change('ship', 1, 2)); await a.ok(change('cancel', 2, 2)); await a.ok(change('return', 3, 1));
  await unchanged(a, () => a.error(change('return', 4, 2), 'INVALID_QUANTITY'));
});
test('O08', 'orders', 'Multi-line return overflow rolls back earlier restoration', async a => {
  await a.receive(5, 'a'); await a.receive(5, 'z'); await a.order([{ sku: 'a', quantity: 2 }, { sku: 'z', quantity: 2 }]);
  await a.ok({ op: 'ship', orderId: 'o1', ifRevision: 1, items: [{ sku: 'a', quantity: 2 }, { sku: 'z', quantity: 2 }] });
  await a.receive(999_999_997, 'z');
  await unchanged(a, () => a.error({ op: 'return', orderId: 'o1', ifRevision: 2, items: [{ sku: 'a', quantity: 1 }, { sku: 'z', quantity: 1 }] }, 'LIMIT'));
});
