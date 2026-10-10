import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { withService } from '../evaluation/tests/harness.mjs';
import { root } from '../evaluation/util.mjs';

test('repeated state reads stay fresh across commits, retries, errors, expiry, and restarts', async () => {
  await withService({ solution: path.join(root, 'reference') }, async api => {
    const same = async expected => {
      for (let i = 0; i < 4; i++) assert.deepEqual(await api.state(), expected);
    };
    await same(await api.state());
    const receipt = { op: 'receive', requestId: 'cached-receipt', warehouse: 'A', sku: 'widget', quantity: 8 };
    assert.equal((await api.command(receipt)).status, 200);
    const received = await api.state();
    assert.equal(received.inventory[0].onHand, 8); await same(received);
    assert.equal((await api.command(receipt)).status, 200); await same(received);
    await api.error({ ...receipt, requestId: 'invalid', quantity: 1_000_000_000 }, 'LIMIT'); await same(received);
    await api.order();
    const reserved = await api.state(); assert.equal(reserved.inventory[0].reserved, 4); await same(reserved);
    await api.ok({ op: 'advanceClock', now: 10 });
    const expired = await api.state(); assert.equal(expired.inventory[0].reserved, 0); await same(expired);
    await api.restart(); await same(expired);
  });
});
