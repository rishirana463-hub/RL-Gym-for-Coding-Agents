import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { root } from '../evaluation/util.mjs';

test('historical OpenHands logs stay byte-preserved in clean checkouts', () => {
  const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  assert.match(attributes, /^evals\/openhands-preflight\/logs\/\*\.log -text$/m);
});
