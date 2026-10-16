const MAX = 1_000_000_000;
const MAX_TIME = 9_000_000_000_000;
const own = (o, k) => Object.hasOwn(o, k);
export class DomainError extends Error {
  constructor(code, status = 409) { super(code); this.code = code; this.status = status; }
}
const fail = (code, status) => { throw new DomainError(code, status); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const fields = (x, required, optional = []) => {
  if (!object(x) || required.some(k => !own(x, k)) || Object.keys(x).some(k => !required.includes(k) && !optional.includes(k))) fail('VALIDATION', 400);
};
const ident = x => { if (typeof x !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(x)) fail('VALIDATION', 400); };
const number = (x, min, max = MAX) => { if (!Number.isSafeInteger(x) || x < min || x > max) fail('VALIDATION', 400); };
const itemList = xs => {
  if (!Array.isArray(xs) || xs.length < 1 || xs.length > 100) fail('VALIDATION', 400);
  const seen = new Set();
  for (const x of xs) {
    fields(x, ['sku', 'quantity']); ident(x.sku); number(x.quantity, 1);
    if (seen.has(x.sku)) fail('VALIDATION', 400);
    seen.add(x.sku);
  }
};
export function canonical(x) {
  if (Array.isArray(x)) return `[${x.map(canonical).join(',')}]`;
  if (object(x)) return `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}`;
  return JSON.stringify(x);
}
export function validate(c) {
  if (!object(c) || typeof c.op !== 'string') fail('VALIDATION', 400);
  const schemas = {
    receive: ['warehouse', 'sku', 'quantity'],
    createOrder: ['orderId', 'warehouse', 'expiresAt', 'items'],
    ship: ['orderId', 'ifRevision', 'items'],
    cancel: ['orderId', 'ifRevision', 'items'],
    return: ['orderId', 'ifRevision', 'items'],
    dispatchTransfer: ['transferId', 'from', 'to', 'items'],
    receiveTransfer: ['transferId', 'ifRevision', 'items'],
    cancelTransfer: ['transferId', 'ifRevision', 'items'],
    advanceClock: ['now']
  };
  if (!own(schemas, c.op)) fail('VALIDATION', 400);
  fields(c, ['op', 'requestId', ...schemas[c.op]]);
  ident(c.requestId);
  for (const k of ['warehouse', 'sku', 'orderId', 'transferId', 'from', 'to']) if (own(c, k)) ident(c[k]);
  if (own(c, 'quantity')) number(c.quantity, 1);
  if (own(c, 'ifRevision')) number(c.ifRevision, 1, Number.MAX_SAFE_INTEGER);
  if (own(c, 'expiresAt')) number(c.expiresAt, 0, MAX_TIME);
  if (own(c, 'now')) number(c.now, 0, MAX_TIME);
  if (own(c, 'items')) itemList(c.items);
}
export const initial = () => ({ now: 0, sequence: 0, inventory: {}, orders: {}, transfers: {}, audit: [], requests: {} });
const key = (warehouse, sku) => `${warehouse}/${sku}`;
const stock = (s, warehouse, sku) => {
  const k = key(warehouse, sku);
  if (!own(s.inventory, k)) s.inventory[k] = { warehouse, sku, onHand: 0, reserved: 0 };
  return s.inventory[k];
};
const available = x => x.onHand - x.reserved;
const addStock = (x, q) => { if (x.onHand + q > MAX) fail('LIMIT'); x.onHand += q; };
const orderStatus = o => o.lines.some(x => x.reserved > 0) ? 'OPEN' : 'CLOSED';
const transferStatus = t => t.lines.some(x => x.quantity > x.received + x.cancelled) ? 'IN_TRANSIT' : 'CLOSED';
const orderView = o => ({ ...structuredClone(o), status: orderStatus(o) });
const transferView = t => ({ ...structuredClone(t), status: transferStatus(t) });
const get = (map, id) => { if (!own(map, id)) fail('NOT_FOUND', 404); return map[id]; };
const revision = (x, expected) => { if (x.revision !== expected) fail('STALE_REVISION'); };
const sort = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function view(s) {
  return {
    now: s.now, sequence: s.sequence,
    inventory: Object.values(s.inventory).sort((a, b) => sort(a.warehouse, b.warehouse) || sort(a.sku, b.sku)).map(x => ({ ...x, available: available(x) })),
    orders: Object.values(s.orders).sort((a, b) => sort(a.id, b.id)).map(orderView),
    transfers: Object.values(s.transfers).sort((a, b) => sort(a.id, b.id)).map(transferView),
    audit: structuredClone(s.audit)
  };
}
export function execute(previous, c) {
  validate(c);
  const fingerprint = canonical(c);
  if (own(previous.requests, c.requestId)) {
    const old = previous.requests[c.requestId];
    if (old.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT');
    return { state: previous, response: structuredClone(old.response), replay: true };
  }
  // All checks and edits operate on an isolated transaction; failures discard it.
  const s = structuredClone(previous);
  let result;
  if (c.op === 'receive') {
    const x = stock(s, c.warehouse, c.sku); addStock(x, c.quantity);
    result = { ...x, available: available(x) };
  } else if (c.op === 'createOrder') {
    if (own(s.orders, c.orderId)) fail('ALREADY_EXISTS');
    if (c.expiresAt <= s.now) fail('INVALID_TIME');
    const lines = c.items.map(x => ({ sku: x.sku, quantity: x.quantity, reserved: x.quantity, shipped: 0, cancelled: 0, returned: 0 })).sort((a, b) => sort(a.sku, b.sku));
    for (const x of lines) {
      const inv = stock(s, c.warehouse, x.sku);
      if (available(inv) < x.quantity) fail('INSUFFICIENT_STOCK');
      inv.reserved += x.quantity;
    }
    const o = { id: c.orderId, warehouse: c.warehouse, expiresAt: c.expiresAt, revision: 1, lines };
    s.orders[c.orderId] = o; result = orderView(o);
  } else if (['ship', 'cancel', 'return'].includes(c.op)) {
    const o = get(s.orders, c.orderId); revision(o, c.ifRevision);
    for (const item of c.items) {
      const x = o.lines.find(x => x.sku === item.sku);
      if (!x) fail('INVALID_QUANTITY');
      const inv = stock(s, o.warehouse, x.sku);
      const q = item.quantity;
      if (c.op === 'return') {
        if (q > x.shipped - x.returned) fail('INVALID_QUANTITY');
        addStock(inv, q); x.returned += q;
      } else {
        if (q > x.reserved) fail('INVALID_QUANTITY');
        inv.reserved -= q; x.reserved -= q;
        if (c.op === 'ship') { inv.onHand -= q; x.shipped += q; }
        else x.cancelled += q;
      }
    }
    o.revision += 1; result = orderView(o);
  } else if (c.op === 'dispatchTransfer') {
    if (own(s.transfers, c.transferId)) fail('ALREADY_EXISTS');
    if (c.from === c.to) fail('SAME_WAREHOUSE');
    const lines = c.items.map(x => ({ sku: x.sku, quantity: x.quantity, received: 0, cancelled: 0 })).sort((a, b) => sort(a.sku, b.sku));
    for (const x of lines) {
      const inv = stock(s, c.from, x.sku);
      if (available(inv) < x.quantity) fail('INSUFFICIENT_STOCK');
      inv.onHand -= x.quantity;
    }
    const t = { id: c.transferId, from: c.from, to: c.to, revision: 1, lines };
    s.transfers[c.transferId] = t; result = transferView(t);
  } else if (['receiveTransfer', 'cancelTransfer'].includes(c.op)) {
    const t = get(s.transfers, c.transferId); revision(t, c.ifRevision);
    for (const item of c.items) {
      const x = t.lines.find(x => x.sku === item.sku);
      if (!x || item.quantity > x.quantity - x.received - x.cancelled) fail('INVALID_QUANTITY');
      if (c.op === 'receiveTransfer') {
        addStock(stock(s, t.to, x.sku), item.quantity); x.received += item.quantity;
      } else {
        addStock(stock(s, t.from, x.sku), item.quantity); x.cancelled += item.quantity;
      }
    }
    t.revision += 1; result = transferView(t);
  } else if (c.op === 'advanceClock') {
    if (c.now < s.now) fail('INVALID_TIME');
    s.now = c.now;
    const expired = [];
    for (const o of Object.values(s.orders).sort((a, b) => sort(a.id, b.id))) {
      if (o.expiresAt <= s.now && o.lines.some(x => x.reserved > 0)) {
        for (const x of o.lines) {
          stock(s, o.warehouse, x.sku).reserved -= x.reserved;
          x.cancelled += x.reserved; x.reserved = 0;
        }
        o.revision += 1; expired.push(o.id);
      }
    }
    result = { now: s.now, expired };
  }
  s.sequence += 1;
  s.audit.push({ sequence: s.sequence, requestId: c.requestId, op: c.op, now: s.now });
  const response = { ok: true, sequence: s.sequence, result };
  s.requests[c.requestId] = { fingerprint, response: structuredClone(response) };
  return { state: s, response, replay: false };
}
