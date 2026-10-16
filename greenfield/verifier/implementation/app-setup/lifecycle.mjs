import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [operation, supplied = '.'] = process.argv.slice(2);
const directory = fs.realpathSync(path.resolve(supplied));
if (operation === 'build') {
  if (!fs.existsSync(path.join(directory, 'server.mjs'))) throw new Error('Missing server.mjs');
  const walk = dir => {
    for (const x of fs.readdirSync(dir, { withFileTypes: true })) {
      if (x.isSymbolicLink()) throw new Error('Source symlinks are not supported');
      if (['node_modules', '.git', '.state'].includes(x.name)) continue;
      const filename = path.join(dir, x.name);
      if (x.isDirectory()) walk(filename);
      else if (x.name.endsWith('.mjs')) {
        const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
        if (result.status !== 0) process.exit(1);
      }
    }
  };
  walk(directory); console.log('Build checks passed.');
} else if (operation === 'reset') {
  const target = path.resolve(directory, process.env.DATA_DIR ?? '.state');
  const relative = path.relative(directory, target);
  // Only delete a strictly nested, explicitly scoped state directory.
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Reset DATA_DIR must be strictly inside SOLUTION_DIR');
  const parts = relative.split(path.sep);
  let cursor = directory;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Refusing reset through a symlink');
  }
  if (fs.existsSync(target) && !fs.lstatSync(target).isDirectory()) throw new Error('Reset DATA_DIR must be a directory');
  if (['server.mjs', 'package.json', 'instruction.md'].some(file => fs.existsSync(path.join(target, file)))) throw new Error('Refusing to delete source files');
  const containsSource = dir => fs.readdirSync(dir, { withFileTypes: true }).some(entry => {
    const filename = path.join(dir, entry.name);
    return entry.isSymbolicLink() || (entry.isFile() && /\.(?:mjs|cjs|js|ts|py|sh)$/.test(entry.name)) || (entry.isDirectory() && containsSource(filename));
  });
  if (fs.existsSync(target) && containsSource(target)) throw new Error('Refusing reset of a directory containing source files or symlinks');
  fs.rmSync(target, { recursive: true, force: true }); console.log('Generated state cleared.');
} else throw new Error('Expected build or reset');
