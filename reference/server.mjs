import http from 'node:http';
import path from 'node:path';
import { execute, view, DomainError } from './engine.mjs';
import { openStore } from './store.mjs';
import { readCommand, send } from './http.mjs';

const { load, persist } = openStore(path.resolve(process.env.DATA_DIR ?? '.state'));
let state = load();
let failed = false;
const server = http.createServer(async (req, res) => {
  if (failed) return send(res, 500, { ok: false, error: { code: 'INTERNAL' } });
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && req.url === '/v1/state') return send(res, 200, { ok: true, result: view(state) });
  if (req.method !== 'POST' || req.url !== '/v1/commands') return send(res, 404, { ok: false, error: { code: 'NOT_FOUND' } });
  try {
    const command = await readCommand(req);
    if (failed) return send(res, 500, { ok: false, error: { code: 'INTERNAL' } });
    // No await in the transaction: simultaneous requests serialize here.
    const outcome = execute(state, command);
    if (!outcome.replay) {
      try { persist(outcome.state); state = outcome.state; }
      catch (error) {
        // Immediately disable writes when the disk may have committed before an error.
        failed = true; server.close(); setImmediate(() => process.exit(1));
        throw error;
      }
    }
    send(res, 200, outcome.response);
  } catch (error) {
    // Interrupted uploads never started a transaction and must not kill the service.
    if (req.aborted || res.destroyed) return;
    if (error instanceof DomainError) send(res, error.status, { ok: false, error: { code: error.code } });
    else {
      console.error(error);
      send(res, 500, { ok: false, error: { code: 'INTERNAL' } });
    }
  }
});
server.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => {
  console.log(JSON.stringify({ event: 'ready', port: server.address().port }));
});
