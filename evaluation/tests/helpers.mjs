import assert from 'node:assert/strict';

export const items = (quantity, sku = 'widget') => [{ sku, quantity }];
export const change = (op, ifRevision, quantity, orderId = 'o1') => ({ op, orderId, ifRevision, items: items(quantity) });
export const move = (op, ifRevision, quantity, transferId = 't1') => ({ op, transferId, ifRevision, items: items(quantity) });
export const row = (s, warehouse = 'A', sku = 'widget') => s.inventory.find(x => x.warehouse === warehouse && x.sku === sku);
export async function unchanged(a, action) { const before = await a.state(); await action(); assert.deepEqual(await a.state(), before); }
