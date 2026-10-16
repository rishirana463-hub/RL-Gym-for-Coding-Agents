import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { items, change, move, row } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('R01', 'recovery', 'Acknowledged inventory and reservations survive forced termination', async a => {
  await a.receive(12); await a.order(); const before = await a.state(); await a.restart(); assert.deepEqual(await a.state(), before);
  await a.ok(change('ship', 1, 1));
});
test('R02', 'recovery', 'Retry ledger and original snapshots survive repeated termination', async a => {
  await a.receive(); await a.order(); const c = { ...change('ship', 1, 1), requestId: 'durable' }; const first = await a.command(c);
  await a.ok(change('cancel', 2, 3)); const before = await a.state();
  for (let i = 0; i < 2; i++) { await a.restart(); assert.deepEqual(await a.command(c), first); assert.deepEqual(await a.state(), before); }
});
test('R03', 'recovery', 'Clock, transfer progress, returns and audit recover together', async a => {
  await a.receive(20); await a.order(); await a.ok(change('ship', 1, 2)); await a.ok(change('return', 2, 1));
  await a.transfer(5); await a.ok(move('receiveTransfer', 1, 2)); await a.ok({ op: 'advanceClock', now: 10 });
  const before = await a.state(); await a.restart(); assert.deepEqual(await a.state(), before); await a.ok(move('cancelTransfer', 2, 3));
});
test('R04', 'recovery', 'Unrelated recovery-directory artifacts do not overwrite committed state', async a => {
  await a.receive(); await a.order(); const before = await a.state(); await a.stop();
  fs.writeFileSync(path.join(a.data, 'unrelated-incomplete-upload.tmp'), '{truncated');
  await a.restart(); assert.deepEqual(await a.state(), before);
});
test('R05', 'recovery', 'Interrupted unacknowledged receipt is atomic and retryable exactly once', async a => {
  await a.receive(5);
  const c = { op: 'receive', requestId: 'interrupted', warehouse: 'A', sku: 'widget', quantity: 3 };
  const pending = a.command(c).catch(() => null); await a.stop(); const response = await pending;
  await a.restart(); const s = await a.state(); assert.ok([5, 8].includes(row(s).onHand));
  if (response?.status === 200) assert.equal(row(s).onHand, 8);
  const r = await a.command(c); assert.equal(r.status, 200); assert.equal(row(await a.state()).onHand, 8); assert.equal((await a.state()).sequence, 2);
  if (response?.status === 200) assert.deepEqual(r, response);
});
test('R06', 'recovery', 'Long mixed workflow conserves units through restart and transfer retries', async a => {
  await a.receive(30); await a.order(items(10)); await a.ok(change('ship', 1, 4)); await a.ok(change('return', 2, 2));
  const c = { op: 'dispatchTransfer', requestId: 'dispatch-once', transferId: 't1', from: 'A', to: 'B', items: items(8) }; const dispatched = await a.command(c);
  await a.ok(move('receiveTransfer', 1, 3)); await a.restart(); assert.deepEqual(await a.command(c), dispatched);
  await a.ok(move('cancelTransfer', 2, 5)); await a.ok({ op: 'advanceClock', now: 10 });
  const s = await a.state(); assert.equal(row(s).onHand, 25); assert.equal(row(s, 'B').onHand, 3); assert.equal(row(s).reserved, 0);
  assert.equal(s.orders[0].lines[0].cancelled, 6); assert.equal(s.transfers[0].status, 'CLOSED');
  assert.equal(s.inventory.reduce((sum, x) => sum + x.onHand, 0) + 4 - 2, 30);
});
