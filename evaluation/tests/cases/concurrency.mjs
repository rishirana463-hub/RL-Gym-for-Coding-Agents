import assert from 'node:assert/strict';
import { items, change, move, row } from '../helpers.mjs';

export const cases = [];
const test = (id, group, description, run) => cases.push({ id, group, description, run });

test('C01', 'concurrency', 'Concurrent reservations cannot oversell the last units', async a => {
  await a.receive(7);
  const responses = await Promise.all(Array.from({ length: 16 }, (_, i) => a.command({ op: 'createOrder', requestId: `c${i}`, orderId: `o${i}`, warehouse: 'A', expiresAt: 10, items: items(1) })));
  assert.equal(responses.filter(r => r.status === 200).length, 7);
  for (const r of responses.filter(r => r.status !== 200)) { assert.equal(r.status, 409); assert.equal(r.body.error.code, 'INSUFFICIENT_STOCK'); }
  const s = await a.state(); assert.equal(row(s).available, 0); assert.equal(s.sequence, 8); assert.equal(s.orders.length, 7);
});
test('C02', 'concurrency', 'Identical concurrent retries have exactly one effect', async a => {
  const c = { op: 'receive', requestId: 'same', warehouse: 'A', sku: 'widget', quantity: 3 };
  const responses = await Promise.all(Array.from({ length: 16 }, () => a.command(c)));
  assert.equal(responses[0].status, 200); for (const r of responses) assert.deepEqual(r, responses[0]);
  assert.equal(row(await a.state()).onHand, 3); assert.equal((await a.state()).audit.length, 1);
});
test('C03', 'concurrency', 'Two order writers at one revision cannot both succeed', async a => {
  await a.receive(); await a.order();
  const r = await Promise.all([a.command({ ...change('ship', 1, 1), requestId: 's' }), a.command({ ...change('cancel', 1, 1), requestId: 'c' })]);
  assert.deepEqual(r.map(x => x.status).sort(), [200, 409]); assert.equal(r.find(x => x.status === 409).body.error.code, 'STALE_REVISION');
  assert.equal((await a.state()).orders[0].revision, 2);
});
test('C04', 'concurrency', 'Transfer receipt and cancellation share revision protection', async a => {
  await a.receive(); await a.transfer();
  const r = await Promise.all([a.command({ ...move('receiveTransfer', 1, 2), requestId: 'r' }), a.command({ ...move('cancelTransfer', 1, 2), requestId: 'c' })]);
  assert.deepEqual(r.map(x => x.status).sort(), [200, 409]); assert.equal(r.find(x => x.status === 409).body.error.code, 'STALE_REVISION');
  assert.equal((await a.state()).transfers[0].revision, 2);
});
test('C05', 'concurrency', 'Independent concurrent receipts have no lost updates or audit gaps', async a => {
  const r = await Promise.all(Array.from({ length: 20 }, (_, i) => a.command({ op: 'receive', requestId: `r${i}`, warehouse: 'A', sku: 'widget', quantity: 1 })));
  assert.ok(r.every(x => x.status === 200)); const s = await a.state(); assert.equal(row(s).onHand, 20);
  assert.deepEqual(s.audit.map(x => x.sequence), Array.from({ length: 20 }, (_, i) => i + 1));
});
test('C06', 'concurrency', 'Shipment racing expiry has only serializable outcomes', async a => {
  await a.receive(4); await a.order();
  const r = await Promise.all([a.command({ ...change('ship', 1, 2), requestId: 'ship' }), a.command({ op: 'advanceClock', requestId: 'clock', now: 10 })]);
  assert.equal(r[1].status, 200); assert.ok([200, 409].includes(r[0].status));
  const s = await a.state(), o = s.orders[0]; assert.equal(o.status, 'CLOSED'); assert.equal(o.lines[0].reserved, 0); assert.equal(row(s).reserved, 0);
  if (r[0].status === 200) { assert.equal(o.lines[0].shipped, 2); assert.equal(o.lines[0].cancelled, 2); assert.equal(row(s).onHand, 2); }
  else { assert.equal(r[0].body.error.code, 'STALE_REVISION'); assert.equal(o.lines[0].shipped, 0); assert.equal(o.lines[0].cancelled, 4); assert.equal(row(s).onHand, 4); }
});
