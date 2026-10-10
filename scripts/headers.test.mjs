import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { withService } from '../evaluation/tests/harness.mjs';
import { root } from '../evaluation/util.mjs';

test('API success and error responses are JSON and carry noindex', async () => {
  await withService({ solution: path.join(root, 'reference') }, async api => {
    for (const [route, init, expectedStatus] of [
      ['/health', {}, 200], ['/v1/state', {}, 200], ['/missing', {}, 404],
      ['/v1/commands', { method: 'POST', body: '{' }, 400]
    ]) {
      const response = await fetch(`${api.url}${route}`, init);
      assert.equal(response.status, expectedStatus);
      assert.equal(response.headers.get('content-type'), 'application/json');
      assert.equal(response.headers.get('x-robots-tag'), 'noindex');
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(typeof await response.json(), 'object');
    }
  });
});
