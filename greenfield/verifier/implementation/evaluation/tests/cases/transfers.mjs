import assert from 'node:assert/strict';
import { items, move, row, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('F01', 'transfers', 'Dispatch removes source stock without crediting destination', async a => {
  await a.receive(); const t = await a.transfer(); assert.equal(t.result.status, 'IN_TRANSIT'); assert.equal(t.result.revision, 1);
  const s = await a.state(); assert.equal(row(s).onHand, 6); assert.equal(row(s, 'B'), undefined);
  await a.error({ op: 'createOrder', orderId: 'o1', warehouse: 'B', expiresAt: 10, items: items(1) }, 'INSUFFICIENT_STOCK');
});
test('F02', 'transfers', 'Dispatch cannot consume reserved stock and same-warehouse fails', async a => {
  await a.receive(5); await a.order();
  await unchanged(a, async () => {
    await a.error({ op: 'dispatchTransfer', transferId: 't1', from: 'A', to: 'B', items: items(2) }, 'INSUFFICIENT_STOCK');
    await a.error({ op: 'dispatchTransfer', transferId: 't1', from: 'A', to: 'A', items: items(1) }, 'SAME_WAREHOUSE');
  });
});
test('F03', 'transfers', 'Multi-SKU dispatch is atomic on insufficient stock', async a => {
  await a.receive(5, 'a'); await a.receive(1, 'z');
  await unchanged(a, () => a.error({ op: 'dispatchTransfer', transferId: 't1', from: 'A', to: 'B', items: [{ sku: 'a', quantity: 2 }, { sku: 'z', quantity: 2 }] }, 'INSUFFICIENT_STOCK'));
});
test('F04', 'transfers', 'Partial receipt and cancellation close transfer with correct stock', async a => {
  await a.receive(); await a.transfer(); await a.ok(move('receiveTransfer', 1, 1));
  const t = await a.ok(move('cancelTransfer', 2, 3)); assert.equal(t.result.status, 'CLOSED'); assert.equal(t.result.revision, 3);
  assert.deepEqual(t.result.lines, [{ sku: 'widget', quantity: 4, received: 1, cancelled: 3 }]);
  const s = await a.state(); assert.equal(row(s).onHand, 9); assert.equal(row(s, 'B').onHand, 1);
});
test('F05', 'transfers', 'Received or cancelled quantities cannot be processed twice', async a => {
  await a.receive(); await a.transfer(); await a.ok(move('receiveTransfer', 1, 3));
  await unchanged(a, async () => { for (const op of ['receiveTransfer', 'cancelTransfer']) await a.error(move(op, 2, 2), 'INVALID_QUANTITY'); });
});
test('F06', 'transfers', 'Transfer stale revisions and duplicate IDs are protected', async a => {
  await a.receive(); await a.transfer(); await a.ok(move('cancelTransfer', 1, 4));
  await unchanged(a, async () => {
    await a.error(move('receiveTransfer', 1, 1), 'STALE_REVISION');
    await a.error({ op: 'dispatchTransfer', transferId: 't1', from: 'A', to: 'A', items: items(1) }, 'ALREADY_EXISTS');
  });
});
test('F07', 'transfers', 'Destination overflow rolls back all receipt lines', async a => {
  for (const sku of ['a', 'z']) await a.receive(5, sku);
  await a.receive(1_000_000_000, 'z', 'B');
  await a.ok({ op: 'dispatchTransfer', transferId: 't1', from: 'A', to: 'B', items: [{ sku: 'a', quantity: 2 }, { sku: 'z', quantity: 2 }] });
  await unchanged(a, () => a.error({ op: 'receiveTransfer', transferId: 't1', ifRevision: 1, items: [{ sku: 'a', quantity: 1 }, { sku: 'z', quantity: 1 }] }, 'LIMIT'));
});
test('F08', 'transfers', 'Source overflow and unknown transfer lines fail atomically', async a => {
  await a.receive(4); await a.transfer(); await a.receive(1_000_000_000);
  await unchanged(a, async () => {
    await a.error(move('cancelTransfer', 1, 1), 'LIMIT');
    await a.error({ op: 'receiveTransfer', transferId: 't1', ifRevision: 1, items: items(1, 'missing') }, 'INVALID_QUANTITY');
  });
});
