import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { runtimeEnvironment } from '../evaluation/environment.mjs';
import { dockerEnvironment } from '../evaluation/docker-environment.mjs';
import { withService } from '../evaluation/tests/harness.mjs';

test('runtime environment includes OS paths and excludes credentials and Node injection', () => {
  assert.deepEqual(runtimeEnvironment({ Path: 'runtime-path', SystemRoot: 'system-path', TEMP: 'temporary-path', LANG: 'C', LLM_API_KEY: 'private', GITHUB_TOKEN: 'private', NODE_OPTIONS: '--inspect', NODE_PATH: 'other-code', DATA_DIR: 'host-data' }), { Path: 'runtime-path', SystemRoot: 'system-path', TEMP: 'temporary-path', LANG: 'C' });
});

test('Docker client keeps connection settings without model credentials', () => {
  const source = { PATH: 'runtime-path', DOCKER_HOST: 'tcp://daemon.example.invalid:2376', DOCKER_CONTEXT: 'evaluation', DOCKER_TLS_VERIFY: '1', DOCKER_CERT_PATH: 'certificate-path', DOCKER_CONFIG: 'configuration-path', SSH_AUTH_SOCK: 'agent-socket', HTTPS_PROXY: 'proxy-path', LLM_API_KEY: 'private', llm_api_key: 'private', LLM_BASE_URL: 'provider-path' };
  const result = dockerEnvironment(source);
  assert.equal(Object.hasOwn(result, 'LLM_API_KEY'), false);
  assert.equal(Object.hasOwn(result, 'llm_api_key'), false);
  assert.equal(Object.hasOwn(result, 'LLM_BASE_URL'), false);
  for (const name of ['PATH', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH', 'DOCKER_CONFIG', 'SSH_AUTH_SOCK', 'HTTPS_PROXY']) assert.equal(result[name], source[name]);
  assert.equal(source.LLM_API_KEY, 'private');
});

test('local candidate process cannot read a host secret from its environment', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stockroom-env-test-'));
  const previous = process.env.STOCKROOM_TEST_SECRET;
  process.env.STOCKROOM_TEST_SECRET = 'private-test-value';
  fs.writeFileSync(path.join(directory, 'server.mjs'), `
    import http from 'node:http';
    const server = http.createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ leaked: Object.hasOwn(process.env, 'STOCKROOM_TEST_SECRET') })); });
    server.listen(Number(process.env.PORT), process.env.HOST, () => console.log(JSON.stringify({ event: 'ready', port: server.address().port })));
  `);
  try {
    await withService({ solution: directory }, async api => {
      const response = await api.raw('/health');
      assert.equal(response.body.leaked, false);
      if (process.platform !== 'win32') assert.equal(fs.statSync(api.data).mode & 0o077, 0);
    });
  } finally {
    if (previous === undefined) delete process.env.STOCKROOM_TEST_SECRET; else process.env.STOCKROOM_TEST_SECRET = previous;
    const target = fs.realpathSync(directory);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('stockroom-env-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
});
