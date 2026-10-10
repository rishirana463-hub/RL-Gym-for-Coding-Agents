import { withService } from '../evaluation/tests/harness.mjs';
import { root, write } from '../evaluation/util.mjs';
import path from 'node:path';

await withService({ solution: path.join(root, 'reference') }, async app => {
  const steps = [];
  const step = async (label, c) => {
    const response = await app.ok(c); steps.push({ label, response, state: await app.state() }); console.log(label);
  };
  await step('Receive 20 widgets into warehouse A', { op: 'receive', requestId: 'receive-1', warehouse: 'A', sku: 'widget', quantity: 20 });
  await step('Reserve 8 widgets for order o1', { op: 'createOrder', requestId: 'reserve-1', warehouse: 'A', orderId: 'o1', expiresAt: 10, items: [{ sku: 'widget', quantity: 8 }] });
  const shipment = { op: 'ship', requestId: 'ship-1', orderId: 'o1', ifRevision: 1, items: [{ sku: 'widget', quantity: 3 }] };
  await step('Ship 3 widgets', shipment);
  await step('Dispatch 5 widgets from A to B', { op: 'dispatchTransfer', requestId: 'transfer-1', transferId: 't1', from: 'A', to: 'B', items: [{ sku: 'widget', quantity: 5 }] });
  await step('Receive 2 of those widgets in B', { op: 'receiveTransfer', requestId: 'receipt-1', transferId: 't1', ifRevision: 1, items: [{ sku: 'widget', quantity: 2 }] });
  await step('Cancel the remaining 3 in transit', { op: 'cancelTransfer', requestId: 'cancel-transfer-1', transferId: 't1', ifRevision: 2, items: [{ sku: 'widget', quantity: 3 }] });
  await step('Expire the unshipped order remainder', { op: 'advanceClock', requestId: 'clock-1', now: 10 });
  await app.restart(); console.log('Force-stop and restart: committed state recovered');
  await step('Retry the old shipment: original response, no second shipment', shipment);
  await step('Return 1 shipped widget', { op: 'return', requestId: 'return-1', orderId: 'o1', ifRevision: 3, items: [{ sku: 'widget', quantity: 1 }] });
  write('evaluation/proof-of-work/demo.json', { generatedAt: new Date().toISOString(), steps });
  console.log(JSON.stringify(await app.state(), null, 2));
});
