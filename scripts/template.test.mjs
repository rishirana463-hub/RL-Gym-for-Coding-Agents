import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, verifierHash, sourceHash } from '../evaluation/util.mjs';
import { exportTemplate, templateFiles } from './export-template.mjs';

test('submission package preserves source and behavioral scoring while separating private assets', async () => {
  const entries = templateFiles();
  assert.deepEqual(entries.get('instruction.md'), fs.readFileSync(path.join(root, 'task/instruction.md')));
  const manifest = JSON.parse(entries.get('template-manifest.json'));
  assert.equal(manifest.authoring_verifier_hash, verifierHash());
  assert.equal(manifest.authoring_reference_hash, sourceHash(path.join(root, 'reference')));
  for (const name of entries.keys()) {
    if (name.startsWith('app/')) assert.ok(!/reference|verifier|proof-of-work/.test(name));
  }
  const { verifierHash: packagedHash } = await import('../greenfield/verifier/implementation/evaluation/util.mjs');
  assert.equal(packagedHash(), manifest.packaged_verifier_hash);
});

test('every exported mutant applies independently to unchanged reference source', () => {
  fs.mkdirSync(path.join(root, '.runs'), { recursive: true });
  const folder = fs.mkdtempSync(path.join(root, '.runs/template-patches-'));
  for (const [name, content] of templateFiles()) {
    if (!name.endsWith('.patch')) continue;
    const patch = path.join(folder, path.basename(name));
    fs.writeFileSync(patch, content);
    const workspace = path.join(folder, path.basename(name, '.patch'));
    fs.cpSync(path.join(root, 'reference'), workspace, { recursive: true });
    assert.equal(spawnSync('git', ['init', '--quiet'], { cwd: workspace }).status, 0);
    const result = spawnSync('git', ['apply', patch], { cwd: workspace, encoding: 'utf8' });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    const modified = content.toString().split('\n')[0].slice('--- a/'.length);
    assert.notDeepEqual(fs.readFileSync(path.join(workspace, modified)), fs.readFileSync(path.join(root, 'reference', modified)));
    assert.equal(spawnSync(process.execPath, ['--check', path.join(workspace, modified)]).status, 0);
  }
});

test('export refuses source paths, unowned contents, symlink parents, leaked dependencies and source drift', () => {
  fs.mkdirSync(path.join(root, '.runs'), { recursive: true });
  const folder = fs.mkdtempSync(path.join(root, '.runs/template-safety-'));
  assert.throws(() => exportTemplate(path.join(root, 'reference')), /greenfield or a scratch/);
  fs.writeFileSync(path.join(folder, 'keep.txt'), 'existing user content');
  assert.throws(() => exportTemplate(folder), /without an export manifest/);
  assert.equal(fs.readFileSync(path.join(folder, 'keep.txt'), 'utf8'), 'existing user content');
  const target = path.join(folder, 'generated');
  exportTemplate(target);
  fs.writeFileSync(path.join(target, 'instruction.md'), 'drift');
  assert.throws(() => exportTemplate(target, true), /stale/);
  exportTemplate(target);
  fs.mkdirSync(path.join(target, 'app/node_modules'));
  assert.throws(() => exportTemplate(target, true), /Excluded dependency/);
  const linked = path.join(folder, 'linked');
  fs.mkdirSync(linked);
  fs.symlinkSync(path.join(root, 'reference'), path.join(linked, 'app'), 'junction');
  assert.throws(() => exportTemplate(linked), /Symlinked export content/);
});
