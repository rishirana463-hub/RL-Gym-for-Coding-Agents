# Stockroom: durable inventory and fulfillment

Implement a warehouse service using Node.js 24+ and its standard library. You may choose any internal architecture and any number of source files. No third-party packages or external services are available. The entry point must be `server.mjs`; `node server.mjs` must run from the solution directory. Do not implement a UI.

## Runtime and transport

Respect `HOST` (default `127.0.0.1`), `PORT` (default `3000`, including `0` for an assigned port), and `DATA_DIR` (default `.state`). A directory is used by one live service process at a time. All durable application state belongs under DATA_DIR. A restart with the same directory must recover it; another directory must start empty. Ignore unrelated files in DATA_DIR. On startup print one JSON line `{ "event": "ready", "port": <actual port> }` when ready.

- `GET /health`: HTTP 200, exactly `{ "ok": true }`.
- `GET /v1/state`: HTTP 200, `{ "ok": true, "result": <state below> }`.
- `POST /v1/commands`: accepts one JSON command; success is HTTP 200, `{ "ok": true, "sequence": N, "result": <operation result> }`.
- Any other route/method: HTTP 404, `{ "ok": false, "error": { "code": "NOT_FOUND" } }`.
- Errors use exactly `{ "ok": false, "error": { "code": CODE } }`. Malformed JSON, unknown operations, missing/extra fields, wrong types, and invalid field ranges are HTTP 400 `VALIDATION`. Other error codes are specified below. Error responses must not mutate anything, including clock, stock rows, audit, retry records, or revisions.

Request bodies up to 1 MiB must be supported. Inputs within this limit are evaluated. Content-Type is normally application/json; no authentication is required.

## Validation and ordering

Every command has exactly `op`, `requestId`, and the fields listed in the command table. Identifiers (`requestId`, order/transfer IDs, warehouses, SKUs) are ASCII strings matching `[A-Za-z0-9][A-Za-z0-9_-]{0,63}`. They are case-sensitive; names such as `constructor` are valid. Numbers must be JSON numbers, not strings. Quantities are integers from 1 through 1,000,000,000. Timestamps are integers from 0 through 9,000,000,000,000. `ifRevision` is a positive safe integer.

An `items` list contains 1–100 objects, each with exactly `{ "sku": ID, "quantity": Q }`. Duplicate SKUs are invalid. Item order does not affect business behavior, but it is part of retry identity. Each stock row's onHand must stay at or below 1,000,000,000; exceeding it is HTTP 409 `LIMIT`.

First validate the complete input shape and field ranges, then resolve idempotency, then business rules. For order/transfer updates, check entity existence, then revision, then requested quantities/stock limits. Creation checks duplicate entity ID before other business checks. When a request violates multiple other business rules, any applicable specified error is acceptable.

## State and invariants

The initial state is `{ "now": 0, "sequence": 0, "inventory": [], "orders": [], "transfers": [], "audit": [] }`.

- Inventory rows: `{ warehouse, sku, onHand, reserved, available }`, with `available = onHand - reserved`. All quantities are nonnegative integers. Sort by warehouse, then SKU, using ASCII lexical order. Rows are created by successful operations touching them and retained at zero. Failed operations must not create rows.
- Orders: `{ id, warehouse, expiresAt, revision, lines, status }`. Lines are sorted by SKU and have `{ sku, quantity, reserved, shipped, cancelled, returned }`. Always `quantity = reserved + shipped + cancelled`, and `0 <= returned <= shipped`. `status` is `OPEN` while any line has reserved stock, otherwise `CLOSED`. Returns do not reopen orders.
- Transfers: `{ id, from, to, revision, lines, status }`. Lines are sorted by SKU and have `{ sku, quantity, received, cancelled }`. The in-transit amount is `quantity - received - cancelled`. `status` is `IN_TRANSIT` while any line has a positive in-transit amount, otherwise `CLOSED`.
- Sort orders and transfers by ID in ASCII lexical order. IDs cannot be reused after closure.
- Audit entries are exactly `{ sequence, requestId, op, now }`, in commit order. Each newly successful command appends one entry and increments the global sequence once. `now` is the clock after that command. Reads, errors, and retries do not append entries or advance the sequence.

## Commands

All rows below implicitly include `op` and `requestId`. Results are snapshots at the time of the original successful command, not live objects.

| op | Additional fields | Behavior / result |
|---|---|---|
| `receive` | `warehouse, sku, quantity` | Add physical stock to that warehouse. Return the updated inventory row. |
| `createOrder` | `orderId, warehouse, expiresAt, items` | Reserve all items in this warehouse atomically; create revision 1. expiresAt must be strictly greater than now, otherwise 409 `INVALID_TIME`. Return the order. |
| `ship` | `orderId, ifRevision, items` | Consume the requested reserved amounts: reduce both onHand and reserved; increase shipped. Increment order revision once and return the order. |
| `cancel` | `orderId, ifRevision, items` | Release the requested reserved amounts; increase cancelled. Physical onHand stays unchanged. Increment revision once and return the order. |
| `return` | `orderId, ifRevision, items` | Add returned stock to the order's original warehouse and increase returned. Never reduce shipped. Increment revision once and return the order. |
| `dispatchTransfer` | `transferId, from, to, items` | Require distinct warehouses (409 `SAME_WAREHOUSE`), consume available stock at the source, and create revision 1. No destination rows are created yet. Return the transfer. |
| `receiveTransfer` | `transferId, ifRevision, items` | Move requested in-transit quantities to destination onHand; increase received. Increment revision once and return the transfer. |
| `cancelTransfer` | `transferId, ifRevision, items` | Restore requested in-transit quantities to source onHand; increase cancelled. Already received stock cannot be recalled. Increment revision once and return the transfer. |
| `advanceClock` | `now` | Require a nondecreasing timestamp (409 `INVALID_TIME` otherwise). Atomically expire every order with expiresAt <= now and remaining reservations: release all its reserved stock into available, move reserved to cancelled, and increment that order's revision once. Return `{ now, expired: [sorted order IDs] }`. |

Missing order/transfer: HTTP 404 `NOT_FOUND`. Existing ID on creation: 409 `ALREADY_EXISTS`. Wrong ifRevision: 409 `STALE_REVISION`. Insufficient available stock on creation/dispatch: 409 `INSUFFICIENT_STOCK`. A missing SKU on an order/transfer update, or any amount exceeding its reserved, returnable, or in-transit quantity: 409 `INVALID_QUANTITY`. All multi-item operations are atomic, including overflow failures.

Time changes **only** through advanceClock. Wall time, reads, and restarts never expire reservations. Advancing to the current time is a new successful command with its own audit entry, but never re-expires an already released order. Partial shipments stay shipped when the remainder expires. Fully shipped/cancelled orders do not change revision at expiry. Reads never change state.

## Idempotency, concurrency, and recovery

Successful request IDs are global across all operations and stored durably. Repeating the same ID with structurally identical JSON returns the exact original response and does nothing, even if its revision or expiry is now stale. Object key order is irrelevant; array order is significant. The same ID with different valid input yields 409 `IDEMPOTENCY_CONFLICT`. Rejected requests do not claim an ID; a corrected request may reuse it.

Concurrent commands must behave like some serial ordering: no overselling, lost updates, duplicated retry effects, or partial transactions. In particular, two different updates against the same revision cannot both succeed, and identical concurrent retries must return identical responses with one effect.

Every acknowledged success must survive abrupt process termination. After interruption during an unacknowledged request, the complete transaction may be present or absent; partial effects are forbidden. Retrying must apply it exactly once overall, including its original retry response. Crash recovery must preserve revisions, clock, audit, and retry identity along with inventory and entities. Persistence format is your choice.

## Example on a fresh service

1. `{ "op":"receive", "requestId":"r1", "warehouse":"A", "sku":"widget", "quantity":5 }` returns sequence 1 and onHand/available 5, reserved 0.
2. `{ "op":"createOrder", "requestId":"r2", "orderId":"o1", "warehouse":"A", "expiresAt":10, "items":[{"sku":"widget","quantity":4}] }` returns revision 1, OPEN, reserved 4.
3. `{ "op":"ship", "requestId":"r3", "orderId":"o1", "ifRevision":1, "items":[{"sku":"widget","quantity":2}] }` returns revision 2, reserved 2, shipped 2.
4. `{ "op":"advanceClock", "requestId":"r4", "now":10 }` returns `{ "now":10, "expired":["o1"] }`. The order is CLOSED at revision 3 with shipped 2 and cancelled 2; inventory is onHand 3, reserved 0, available 3.
5. Retrying step 3 returns its original sequence-3 response (revision 2), with no state change.

`smoke.mjs` is a small public check, not a complete test suite. Implement all documented behavior.
