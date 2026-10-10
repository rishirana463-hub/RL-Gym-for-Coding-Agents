import assert from 'node:assert/strict';
import { items, change, row, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('I01', 'inventory', 'Receipts accumulate independently across SKU and warehouse', async a => {
  await a.receive(7); await a.receive(3); await a.receive(4, 'gadget'); await a.receive(9, 'widget', 'B');
  const s = await a.state(); assert.deepEqual(row(s), { warehouse: 'A', sku: 'widget', onHand: 10, reserved: 0, available: 10 });
  assert.equal(row(s, 'B').onHand, 9); assert.equal(row(s, 'A', 'gadget').onHand, 4);
});
test('I02', 'inventory', 'Inventory and order lines use ASCII lexical order', async a => {
  for (const warehouse of ['z', 'a', 'A']) for (const sku of ['z', 'a', 'A']) await a.receive(2, sku, warehouse);
  const s = await a.state(); assert.deepEqual(s.inventory.map(x => `${x.warehouse}/${x.sku}`), ['A/A', 'A/a', 'A/z', 'a/A', 'a/a', 'a/z', 'z/A', 'z/a', 'z/z']);
  const o = await a.order([{ sku: 'z', quantity: 1 }, { sku: 'A', quantity: 1 }]); assert.deepEqual(o.result.lines.map(x => x.sku), ['A', 'z']);
});
test('I03', 'inventory', 'Stock cap accepts maximum and rejects overflow with no audit effect', async a => {
  await a.receive(1_000_000_000);
  await unchanged(a, () => a.error({ op: 'receive', warehouse: 'A', sku: 'widget', quantity: 1 }, 'LIMIT'));
});
test('I04', 'inventory', 'Unknown stock failure does not leave phantom rows or orders', async a => {
  await unchanged(a, () => a.error({ op: 'createOrder', orderId: 'o1', warehouse: 'A', expiresAt: 10, items: items(1) }, 'INSUFFICIENT_STOCK'));
});
test('I05', 'inventory', 'Reservation, shipment and cancellation conserve physical stock', async a => {
  await a.receive(8); await a.order(items(6));
  assert.deepEqual(row(await a.state()), { warehouse: 'A', sku: 'widget', onHand: 8, reserved: 6, available: 2 });
  await a.ok(change('ship', 1, 2)); await a.ok(change('cancel', 2, 3));
  assert.deepEqual(row(await a.state()), { warehouse: 'A', sku: 'widget', onHand: 6, reserved: 1, available: 5 });
});
test('I06', 'inventory', 'Zero stock rows remain visible after full shipment', async a => {
  await a.receive(4); await a.order(); await a.ok(change('ship', 1, 4));
  assert.deepEqual(row(await a.state()), { warehouse: 'A', sku: 'widget', onHand: 0, reserved: 0, available: 0 });
});
