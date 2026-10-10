import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { findSecrets, scanRepository } from './secret-scan.mjs';

const providerKey = () => ['sk', '-', 'proj', '-', 'A'.repeat(40)].join('');

test('secret signatures return categories without credential values', () => {
  const samples = [
    ['provider-api-key', providerKey()],
    ['aws-access-key', ['AK', 'IA', 'B'.repeat(16)].join('')],
    ['aws-secret', ['AWS_SECRET_ACCESS_KEY', '=', 'B'.repeat(40)].join('')],
    ['github-token', ['gh', 'p_', 'C'.repeat(36)].join('')],
    ['github-token', ['github', '_pat_', 'D'.repeat(40)].join('')],
    ['google-api-key', ['AI', 'za', 'E'.repeat(35)].join('')],
    ['slack-token', ['xox', 'b-', 'F'.repeat(24)].join('')],
    ['stripe-key', ['sk', '_live_', 'G'.repeat(24)].join('')],
    ['private-key', ['-----BEGIN ', 'OPENSSH ', 'PRIVATE KEY-----'].join('')],
    ['credential-url', ['https:', '//user:', 'password', '@example.invalid/path'].join('')],
    ['credential-url', ['https:', '//', 'credential', '@example.invalid/path'].join('')]
  ];
  for (const [category, value] of samples) {
    const result = findSecrets(`prefix ${value} suffix`);
    assert.deepEqual(result, [category]);
    assert.equal(JSON.stringify(result).includes(value), false);
  }
  assert.deepEqual(findSecrets('LLM_API_KEY comes from process.env; https://example.invalid'), []);
});

function fixture(action) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stockroom-secret-scan-'));
  const git = (...parameters) => {
    const result = spawnSync('git', parameters, { cwd: directory, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, 'Fixture Git command must succeed');
  };
  const commit = message => git('-c', 'user.name=Stockroom Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', message);
  try {
    git('init', '--quiet');
    fs.writeFileSync(path.join(directory, '.gitignore'), '.env\n.env.*\n');
    git('add', '.gitignore'); commit('initial fixture');
    action({ directory, git, commit });
  } finally {
    const target = fs.realpathSync(directory);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('stockroom-secret-scan-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
}

test('scan includes untracked files, staged blobs, and unique history after removal', () => fixture(({ directory, git, commit }) => {
  fs.writeFileSync(path.join(directory, 'past.txt'), providerKey());
  git('add', 'past.txt'); commit('historical fixture');
  git('rm', 'past.txt'); commit('remove fixture');
  fs.writeFileSync(path.join(directory, 'staged.txt'), providerKey());
  git('add', 'staged.txt');
  fs.writeFileSync(path.join(directory, 'staged.txt'), 'clean worktree');
  fs.writeFileSync(path.join(directory, 'staged-unique.txt'), providerKey() + 'Z');
  git('add', 'staged-unique.txt');
  fs.writeFileSync(path.join(directory, 'staged-unique.txt'), 'clean worktree');
  fs.writeFileSync(path.join(directory, 'untracked.txt'), providerKey());
  fs.writeFileSync(path.join(directory, '.env'), providerKey());
  fs.writeFileSync(path.join(directory, 'binary.bin'), Buffer.from([0, 255, 254, 128]));
  const report = scanRepository(directory);
  assert.equal(report.passed, false);
  assert.deepEqual(report.findings.map(x => x.file), ['past.txt', 'staged-unique.txt', 'staged.txt', 'untracked.txt'].sort((a, b) => a.localeCompare(b)));
  assert.equal(JSON.stringify(report).includes(providerKey()), false);
  assert.equal(report.scannedHistoryBlobs, 2);
  assert.equal(report.scannedIndexBlobs, 1);
  assert.equal(report.skippedBinaryFiles, 1);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.ignoredEnvironmentPaths, ['.env', '.env.local', '.env.production.local', 'nested/.env']);
}));

test('unscannable text fails closed and UTF-16 secrets are inspected', () => fixture(({ directory }) => {
  fs.writeFileSync(path.join(directory, 'invalid.txt'), Buffer.from([255, 1, 2]));
  fs.writeFileSync(path.join(directory, 'wide.txt'), Buffer.concat([Buffer.from([255, 254]), Buffer.from(providerKey(), 'utf16le')]));
  const report = scanRepository(directory);
  assert.equal(report.passed, false);
  assert.deepEqual(report.errors, [{ file: 'invalid.txt', category: 'unscanned-text' }]);
  assert.deepEqual(report.findings, [{ file: 'wide.txt', category: 'provider-api-key' }]);
}));

test('missing environment ignore rules fail the scan', () => fixture(({ directory }) => {
  fs.writeFileSync(path.join(directory, '.gitignore'), 'node_modules/\n');
  const report = scanRepository(directory);
  assert.equal(report.passed, false);
  assert.equal(report.errors.filter(x => x.category === 'environment-file-not-ignored').length, 4);
}));
