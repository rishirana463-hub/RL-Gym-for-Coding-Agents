import { cases as transport } from './cases/transport.mjs';
import { cases as inventory } from './cases/inventory.mjs';
import { cases as orders } from './cases/orders.mjs';
import { cases as transfers } from './cases/transfers.mjs';
import { cases as clock } from './cases/clock.mjs';
import { cases as idempotency } from './cases/idempotency.mjs';
import { cases as concurrency } from './cases/concurrency.mjs';
import { cases as recovery } from './cases/recovery.mjs';

export const cases = [...transport, ...inventory, ...orders, ...transfers, ...clock, ...idempotency, ...concurrency, ...recovery];
