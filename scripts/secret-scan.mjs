import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isUtf8 } from 'node:buffer';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'node:url';
import { root, args, write } from '../evaluation/util.mjs';

const signatures = [
  ['provider-api-key', /\bsk-(?:proj-|ant-|or-v1-|svcacct-)?[A-Za-z0-9_-]{20,}\b/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['aws-secret', /\b(?:aws_secret_access_key|aws_session_token)\b["']?\s*[:=]\s*["']?[A-Za-z0-9/+=]{32,}/i],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['stripe-key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['private-key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ['credential-url', /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>/@]+@/i]
];

// Findings deliberately contain categories only, never matched values or snippets.
export function findSecrets(text) {
  if (typeof text !== 'string') throw new TypeError('Expected text');
  return signatures.filter(([, pattern]) => pattern.test(text)).map(([category]) => category);
}

const textExtension = /\.(?:[cm]?[jt]sx?|json|jsonl|ya?ml|md|txt|log|py|sh|ps1|toml|ini|cfg|conf|env|html?|css|svg|xml|csv|tsv|sql|pem|key|crt)$/i;
const binaryExtension = /\.(?:png|jpe?g|gif|webp|ico|avif|woff2?|ttf|otf|zip|gz|7z|rar|pdf|mp[34]|wav|ogg|exe|dll|so|bin|pyc)$/i;
const envChecks = ['.env', '.env.local', '.env.production.local', 'nested/.env'];
const isTextPath = filename => textExtension.test(filename) || /(?:^|\/)(?:Dockerfile|\.gitignore|\.dockerignore|\.env(?:\.[^/]*)?)$/.test(filename);

function decode(bytes, filename) {
  if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 254) return new TextDecoder('utf-16le', { fatal: true }).decode(bytes.subarray(2));
  if (bytes.length >= 2 && bytes[0] === 254 && bytes[1] === 255) return new TextDecoder('utf-16be', { fatal: true }).decode(bytes.subarray(2));
  const knownText = isTextPath(filename);
  if (!knownText && (bytes.includes(0) || (binaryExtension.test(filename) && !isUtf8(bytes)))) return null;
  if (bytes.includes(0) || !isUtf8(bytes)) throw new Error('Text encoding cannot be scanned');
  return bytes.toString('utf8');
}

export function scanRepository(directory = root) {
  const report = {
    passed: false, scannedFiles: 0, scannedHistoryBlobs: 0, scannedIndexBlobs: 0,
    skippedBinaryFiles: 0, skippedBinaryBlobs: 0, deletedTrackedFiles: 0,
    ignoredEnvironmentPaths: [], findings: [], errors: []
  };
  const seenFindings = new Set();
  const issue = (list, file, category) => {
    const key = `${list}:${file}:${category}`;
    if (seenFindings.has(key)) return;
    seenFindings.add(key); report[list].push({ file, category });
  };
  const git = (parameters, input, allowed = [0]) => {
    const result = spawnSync('git', parameters, { cwd: directory, input, maxBuffer: 128 * 1024 * 1024, windowsHide: true });
    if (result.error || !allowed.includes(result.status)) throw new Error(`Git ${parameters[0]} scan incomplete`);
    return result.stdout;
  };
  const scan = (bytes, suppliedNames, historical = false) => {
    const filenames = typeof suppliedNames === 'string' ? [suppliedNames] : [...suppliedNames];
    // A historical blob can appear under several names; a text name takes precedence.
    const filename = filenames.find(isTextPath) ?? filenames[0];
    try {
      const content = decode(bytes, filename);
      if (content === null) { report[historical ? 'skippedBinaryBlobs' : 'skippedBinaryFiles'] += 1; return; }
      for (const category of findSecrets(content)) for (const name of filenames) issue('findings', name, category);
    } catch { for (const name of filenames) issue('errors', name, 'unscanned-text'); }
  };
  try {
    const working = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
    if (!isUtf8(working)) throw new Error('Git filenames cannot be decoded');
    for (const filename of new Set(working.toString('utf8').split('\0').filter(Boolean))) {
      const target = path.resolve(directory, filename), relative = path.relative(directory, target);
      if (relative.startsWith('..') || path.isAbsolute(relative)) { issue('errors', filename, 'unsafe-file-path'); continue; }
      try {
        const stat = fs.lstatSync(target);
        if (!stat.isFile()) { issue('errors', filename, 'unscanned-nonregular-file'); continue; }
        scan(fs.readFileSync(target), filename); report.scannedFiles += 1;
      } catch (error) {
        if (error.code === 'ENOENT') report.deletedTrackedFiles += 1;
        else issue('errors', filename, 'unreadable-file');
      }
    }

    const ignored = git(['check-ignore', '--no-index', '-z', '--stdin'], Buffer.from(envChecks.join('\0') + '\0'), [0, 1]);
    report.ignoredEnvironmentPaths = ignored.toString('utf8').split('\0').filter(Boolean).sort();
    for (const filename of envChecks) if (!report.ignoredEnvironmentPaths.includes(filename)) issue('errors', filename, 'environment-file-not-ignored');

    // Enumerate all objects reachable from any Git ref, then scan each unique blob once.
    const objects = new Map();
    for (const line of git(['rev-list', '--objects', '--all']).toString('utf8').split('\n').filter(Boolean)) {
      const match = /^([a-f0-9]{40,64})(?: (.*))?$/.exec(line);
      if (!match) throw new Error('Git history enumeration incomplete');
      objects.set(match[1], new Set([match[2] || '(historical file)']));
    }
    const history = new Set();
    if (objects.size) {
      const types = git(['cat-file', '--batch-check'], Buffer.from([...objects.keys()].join('\n') + '\n')).toString('utf8').trim().split('\n');
      if (types.length !== objects.size) throw new Error('Git object types incomplete');
      for (const line of types) {
        const match = /^([a-f0-9]{40,64}) (blob|tree|commit|tag) (\d+)$/.exec(line);
        if (!match) throw new Error('Git object type unavailable');
        if (match[2] === 'blob') history.add(match[1]);
      }
    }
    // Include staged content too, even when a worktree file was subsequently changed/deleted.
    const index = new Set();
    for (const entry of git(['ls-files', '--stage', '-z']).toString('utf8').split('\0').filter(Boolean)) {
      const match = /^(\d+) ([a-f0-9]{40,64}) [0-3]\t([\s\S]+)$/.exec(entry);
      if (!match) throw new Error('Git index enumeration incomplete');
      if (match[1] === '160000') { issue('errors', match[3], 'unscanned-submodule'); continue; }
      index.add(match[2]);
      if (!objects.has(match[2])) objects.set(match[2], new Set());
      objects.get(match[2]).add(match[3]);
    }
    const blobs = [...new Set([...history, ...index])];
    if (blobs.length) {
      const content = git(['cat-file', '--batch'], Buffer.from(blobs.join('\n') + '\n'));
      let offset = 0;
      for (const oid of blobs) {
        const end = content.indexOf(10, offset);
        if (end === -1) throw new Error('Git blob stream incomplete');
        const match = /^([a-f0-9]{40,64}) blob (\d+)$/.exec(content.subarray(offset, end).toString('ascii'));
        if (!match || match[1] !== oid) throw new Error('Git blob unavailable');
        const size = Number(match[2]), start = end + 1;
        if (!Number.isSafeInteger(size) || start + size >= content.length || content[start + size] !== 10) throw new Error('Git blob content incomplete');
        const filename = objects.get(oid);
        scan(content.subarray(start, start + size), filename, true);
        if (history.has(oid)) report.scannedHistoryBlobs += 1;
        else report.scannedIndexBlobs += 1;
        offset = start + size + 1;
      }
      if (offset !== content.length) throw new Error('Unexpected Git blob stream content');
    }
  } catch {
    // Never include raw subprocess output/errors, which may itself contain credentials.
    issue('errors', '(repository)', 'incomplete-repository-scan');
  }
  report.findings.sort((a, b) => a.file.localeCompare(b.file) || a.category.localeCompare(b.category));
  report.errors.sort((a, b) => a.file.localeCompare(b.file) || a.category.localeCompare(b.category));
  report.passed = report.findings.length === 0 && report.errors.length === 0;
  return report;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const options = args();
  const report = scanRepository();
  if (options.out) write(options.out, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
