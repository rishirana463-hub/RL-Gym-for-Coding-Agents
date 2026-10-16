import assert from 'node:assert/strict';
import { items, change, row, unchanged } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('K01', 'clock', 'Expiration occurs at the exact boundary and releases once', async a => {
  await a.receive(); await a.order();
  assert.deepEqual((await a.ok({ op: 'advanceClock', now: 9 })).result.expired, []);
  assert.deepEqual((await a.ok({ op: 'advanceClock', now: 10 })).result.expired, ['o1']);
  const o = (await a.state()).orders[0]; assert.equal(o.revision, 2); assert.equal(o.status, 'CLOSED'); assert.equal(row(await a.state()).reserved, 0);
  assert.deepEqual((await a.ok({ op: 'advanceClock', now: 10 })).result.expired, []);
  assert.equal((await a.state()).orders[0].revision, 2);
});
test('K02', 'clock', 'Clock cannot move backwards; new orders require future expiry', async a => {
  await a.receive(); await a.ok({ op: 'advanceClock', now: 10 });
  await unchanged(a, async () => {
    await a.error({ op: 'advanceClock', now: 9 }, 'INVALID_TIME');
    for (const expiresAt of [0, 10]) await a.error({ op: 'createOrder', orderId: 'o1', warehouse: 'A', expiresAt, items: items(1) }, 'INVALID_TIME');
  });
});
test('K03', 'clock', 'Expiry preserves shipments and increments each affected revision once', async a => {
  await a.receive(); await a.order(); await a.ok(change('ship', 1, 2)); await a.ok({ op: 'advanceClock', now: 11 });
  const o = (await a.state()).orders[0]; assert.equal(o.revision, 3); assert.equal(o.lines[0].shipped, 2); assert.equal(o.lines[0].cancelled, 2); assert.equal(row(await a.state()).onHand, 8);
  await a.error(change('ship', 2, 1), 'STALE_REVISION'); await a.error(change('ship', 3, 1), 'INVALID_QUANTITY');
});
test('K04', 'clock', 'Closed orders retain revisions at expiry; returns remain possible', async a => {
  await a.receive(); await a.order(); await a.ok(change('ship', 1, 4)); await a.ok({ op: 'advanceClock', now: 20 });
  assert.equal((await a.state()).orders[0].revision, 2); await a.ok(change('return', 2, 1));
});
test('K05', 'clock', 'Bulk expiry sorts IDs and leaves later reservations intact', async a => {
  await a.receive(20); await a.order(items(2), 'z', 10); await a.order(items(3), 'A', 10); await a.order(items(4), 'later', 11);
  const r = await a.ok({ op: 'advanceClock', now: 10 }); assert.deepEqual(r.result.expired, ['A', 'z']);
  const s = await a.state(); assert.equal(row(s).reserved, 4); assert.deepEqual(s.orders.map(x => x.id), ['A', 'later', 'z']);
});
test('K06', 'clock', 'Reads and restarts do not advance logical time or expire orders', async a => {
  await a.receive(); await a.order(items(2), 'o1', 1); const before = await a.state();
  for (let i = 0; i < 3; i++) assert.deepEqual(await a.state(), before);
  await a.restart(); assert.deepEqual(await a.state(), before);
});
