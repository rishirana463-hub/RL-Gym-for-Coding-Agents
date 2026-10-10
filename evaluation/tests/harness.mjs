import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { createOutput, parseEvent } from '../output.mjs';
import { runtimeEnvironment } from '../environment.mjs';

export class ServiceInfrastructureError extends Error {
  constructor(message, options) { super(message, options); this.name = 'ServiceInfrastructureError'; }
}

export async function withService(options, action) {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'stockroom-state-'));
  let child, base, container, launchError, output = '', requestNumber = 0;
  const infrastructureError = () => {
    if (launchError) return new ServiceInfrastructureError(`Service process could not launch: ${output}`, { cause: launchError });
    if (options.dockerImage && child?.exitCode === 125) return new ServiceInfrastructureError(`Docker could not launch the service container: ${output}`);
  };
  const exit = p => new Promise(resolve => { if (p.exitCode !== null || p.signalCode !== null) resolve(); else p.once('exit', resolve); });
  async function stop() {
    if (!child) return;
    if (container) spawnSync('docker', ['kill', container], { stdio: 'ignore' });
    else child.kill('SIGKILL');
    await Promise.race([exit(child), delay(3000)]);
    if (container) spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
    child = undefined;
  }
  async function start() {
    output = ''; launchError = undefined;
    if (options.dockerImage) {
      const listener = net.createServer();
      await new Promise(resolve => { listener.listen(0, '127.0.0.1', resolve); });
      const port = listener.address().port;
      await new Promise(resolve => { listener.close(resolve); });
      container = `stockroom-check-${process.pid}-${Math.random().toString(16).slice(2)}`;
      child = spawn('docker', ['run', '--rm', '--name', container, '--network', 'bridge', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '512m', '--cpus', '1', '--pids-limit', '128', '-p', `127.0.0.1:${port}:3000`, '--mount', `type=bind,source=${data},target=/data`, options.dockerImage], { stdio: ['ignore', 'pipe', 'pipe'] });
      base = `http://127.0.0.1:${port}`;
    } else {
      container = undefined;
      child = spawn(process.execPath, ['server.mjs'], { cwd: options.solution, env: { ...runtimeEnvironment(), DATA_DIR: data, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    }
    const diagnostic = text => { output = (output + text).slice(-2000); };
    const stdout = createOutput({ onText: diagnostic, onLine: line => {
      if (options.dockerImage) return;
      const event = parseEvent(line);
      if (event?.event === 'ready' && Number.isInteger(event.port) && event.port > 0 && event.port <= 65_535) base = `http://127.0.0.1:${event.port}`;
    } });
    const stderr = createOutput({ onText: diagnostic });
    child.on('error', e => { launchError = e; diagnostic(e.message); });
    child.stdout.on('data', bytes => stdout.write(bytes));
    child.stdout.on('end', () => stdout.end());
    child.stderr.on('data', bytes => stderr.write(bytes));
    child.stderr.on('end', () => stderr.end());
    const deadline = Date.now() + (options.dockerImage ? 20_000 : 8000);
    while (Date.now() < deadline) {
      const failure = infrastructureError();
      if (failure) throw failure;
      if (child.exitCode !== null) throw new Error(`Service exited: ${output.slice(-2000)}`);
      if (base) {
        try { const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) }); if (r.status === 200) return; } catch {}
      }
      await delay(25);
    }
    throw new Error(`Service failed to become ready: ${output.slice(-2000)}`);
  }
  const raw = async (url, init = {}) => {
    const r = await fetch(`${base}${url}`, { ...init, signal: AbortSignal.timeout(5000) });
    return { status: r.status, body: await r.json() };
  };
  const command = c => raw('/v1/commands', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c) });
  const api = {
    raw, command, data, stop,
    get url() { return base; },
    restart: async () => { await stop(); base = undefined; await start(); },
    state: async () => { const r = await raw('/v1/state'); assert.equal(r.status, 200); assert.equal(r.body.ok, true); return r.body.result; },
    ok: async c => { const r = await command({ requestId: `req-${++requestNumber}`, ...c }); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.ok, true); return r.body; },
    error: async (c, code, status = 409) => { const r = await command({ requestId: `req-${++requestNumber}`, ...c }); assert.equal(r.status, status); assert.deepEqual(r.body, { ok: false, error: { code } }); },
    receive: (quantity = 10, sku = 'widget', warehouse = 'A') => api.ok({ op: 'receive', warehouse, sku, quantity }),
    order: (items = [{ sku: 'widget', quantity: 4 }], orderId = 'o1', expiresAt = 10, warehouse = 'A') => api.ok({ op: 'createOrder', orderId, warehouse, expiresAt, items }),
    transfer: (quantity = 4, transferId = 't1') => api.ok({ op: 'dispatchTransfer', transferId, from: 'A', to: 'B', items: [{ sku: 'widget', quantity }] })
  };
  // Bind-mounted Linux directories must be writable by the non-root service user.
  if (options.dockerImage && process.platform !== 'win32') fs.chmodSync(data, 0o777);
  try { await start(); await action(api); }
  catch (error) { throw infrastructureError() ?? error; }
  finally {
    await stop();
    const target = fs.realpathSync(data);
    if (!path.basename(target).startsWith('stockroom-state-') || path.dirname(target) !== fs.realpathSync(os.tmpdir())) throw new Error('Unsafe temporary cleanup target');
    fs.rmSync(target, { recursive: true, force: true });
  }
}
