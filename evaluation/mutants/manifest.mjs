// Each mutation is an executable, single-fault variation of the working source.
export const mutants = [
  { id: 'M01', description: 'Apply a successful retry twice', file: 'engine.mjs', before: 'if (own(previous.requests, c.requestId)) {', after: 'if (false && own(previous.requests, c.requestId)) {', checks: ['D01', 'C02'] },
  { id: 'M02', description: 'Treat object key insertion order as retry identity', file: 'engine.mjs', before: 'const fingerprint = canonical(c);', after: 'const fingerprint = JSON.stringify(c);', checks: ['D02'] },
  { id: 'M03', description: 'Silently accept a conflicting request ID', file: 'engine.mjs', before: 'if (old.fingerprint !== fingerprint)', after: 'if (false && old.fingerprint !== fingerprint)', checks: ['D03'] },
  { id: 'M04', description: 'Expire strictly after the deadline instead of at it', file: 'engine.mjs', before: 'o.expiresAt <= s.now', after: 'o.expiresAt < s.now', checks: ['K01', 'K05'] },
  { id: 'M05', description: 'Accept stale revisions', file: 'engine.mjs', before: 'if (x.revision !== expected)', after: 'if (false && x.revision !== expected)', checks: ['O04', 'C03', 'C04'] },
  { id: 'M06', description: 'Validate each return independently of past returns', file: 'engine.mjs', before: 'q > x.shipped - x.returned', after: 'q > x.shipped', checks: ['O07'] },
  { id: 'M07', description: 'Discard physical stock when cancelling a reservation', file: 'engine.mjs', before: 'else x.cancelled += q;', after: 'else { inv.onHand -= q; x.cancelled += q; }', checks: ['I05'] },
  { id: 'M08', description: 'Ship without consuming physical stock', file: 'engine.mjs', before: 'inv.onHand -= q; x.shipped += q;', after: 'x.shipped += q;', checks: ['I05', 'I06'] },
  { id: 'M09', description: 'Credit the destination before transfer receipt', file: 'engine.mjs', before: 'inv.onHand -= x.quantity;', after: 'inv.onHand -= x.quantity; addStock(stock(s, c.to, x.sku), x.quantity);', checks: ['F01'] },
  { id: 'M10', description: 'Restore returns to the wrong warehouse', file: 'engine.mjs', before: 'addStock(inv, q); x.returned += q;', after: "addStock(stock(s, 'Returns', x.sku), q); x.returned += q;", checks: ['O06'] },
  { id: 'M11', description: 'Mutate live state before all lines validate', file: 'engine.mjs', before: 'const s = structuredClone(previous);', after: 'const s = previous;', checks: ['O01', 'O05', 'F03'] },
  { id: 'M12', description: 'Lose retry identity on process restart', file: 'server.mjs', before: 'let state = load();', after: 'let state = load(); state.requests = {};', checks: ['R02'] },
  { id: 'M13', description: 'Count reserved stock as available', file: 'engine.mjs', before: 'const available = x => x.onHand - x.reserved;', after: 'const available = x => x.onHand;', checks: ['F02', 'C01'] },
  { id: 'M14', description: 'Acknowledge in-memory commits without durability', file: 'server.mjs', before: 'persist(outcome.state); state = outcome.state;', after: 'state = outcome.state;', checks: ['R01', 'R03'] },
  { id: 'M15', description: 'Cancel transfers into the destination warehouse', file: 'engine.mjs', before: 'addStock(stock(s, t.from, x.sku), item.quantity);', after: 'addStock(stock(s, t.to, x.sku), item.quantity);', checks: ['F04'] },
  { id: 'M16', description: 'Allow the logical clock to move backwards', file: 'engine.mjs', before: "if (c.now < s.now) fail('INVALID_TIME');", after: "if (false && c.now < s.now) fail('INVALID_TIME');", checks: ['K02'] },
  { id: 'M17', description: 'Omit the inventory cap', file: 'engine.mjs', before: 'if (x.onHand + q > MAX)', after: 'if (false && x.onHand + q > MAX)', checks: ['I03', 'O08', 'F07'] },
  { id: 'M18', description: 'Cancel all ordered units at expiry, including shipped stock', file: 'engine.mjs', before: 'x.cancelled += x.reserved; x.reserved = 0;', after: 'x.cancelled += x.quantity; x.reserved = 0;', checks: ['K03', 'R06'] }
];
