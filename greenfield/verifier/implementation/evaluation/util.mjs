import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
export function write(file, value) { const target = path.resolve(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n'); }
export function args(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`Unexpected argument: ${argv[i]}`);
    out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}
export function files(directory) {
  const result = [];
  const walk = dir => {
    for (const x of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (['.git', '.state', 'node_modules', '__pycache__'].includes(x.name)) continue;
      if (x.isSymbolicLink()) throw new Error('Symlinked source is not permitted');
      const filename = path.join(dir, x.name);
      if (x.isDirectory()) walk(filename); else if (x.isFile()) result.push(filename);
    }
  };
  walk(directory); return result;
}
export function sourceHash(directory) {
  const hash = crypto.createHash('sha256');
  for (const filename of files(directory)) { hash.update(path.relative(directory, filename).replaceAll('\\', '/')); hash.update('\0'); hash.update(fs.readFileSync(filename)); hash.update('\0'); }
  return hash.digest('hex');
}
export function verifierHash() {
  const hash = crypto.createHash('sha256');
  hash.update(sourceHash(path.join(root, 'evaluation/tests')));
  for (const name of ['score.mjs', 'metadata.mjs', 'util.mjs', 'output.mjs', 'environment.mjs', 'scoring.yml', 'acceptance-criteria.yml']) {
    hash.update(name); hash.update('\0'); hash.update(fs.readFileSync(path.join(root, 'evaluation', name)));
  }
  hash.update(sourceHash(path.join(root, 'app-setup')));
  hash.update(fs.readFileSync(path.join(root, 'environment/Dockerfile')));
  hash.update(fs.readFileSync(path.join(root, 'task/instruction.md')));
  return hash.digest('hex');
}
