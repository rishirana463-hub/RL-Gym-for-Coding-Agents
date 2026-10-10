import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { root, files } from '../evaluation/util.mjs';
import { checkMetadata } from '../evaluation/metadata.mjs';

checkMetadata();
for (const directory of ['reference', 'task/public', 'evaluation', 'scripts', 'app-setup']) {
  for (const filename of files(path.join(root, directory)).filter(name => name.endsWith('.mjs'))) {
    const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error(`Syntax check failed: ${path.relative(root, filename)}`);
  }
}
// Build a clean, dependency-free runtime artifact; never include evaluation assets.
const output = path.join(root, 'dist/reference');
if (fs.existsSync(output) && fs.realpathSync(output) !== output) throw new Error('Refusing a symlinked build output');
const parent = path.dirname(output);
fs.mkdirSync(parent, { recursive: true });
if (fs.realpathSync(parent) !== parent) throw new Error('Refusing a symlinked dist directory');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
const runtime = files(path.join(root, 'reference')).filter(name => name.endsWith('.mjs') || path.basename(name) === 'package.json');
let rawBytes = 0, gzipBytes = 0;
for (const filename of runtime) {
  const target = path.join(output, path.relative(path.join(root, 'reference'), filename));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content = fs.readFileSync(filename); fs.writeFileSync(target, content);
  rawBytes += content.length; gzipBytes += gzipSync(content).length;
}
fs.writeFileSync(path.join(root, 'dist/build-size.json'), JSON.stringify({ artifact: 'Node reference runtime', files: runtime.length, rawBytes, gzipBytes, browserBundle: null }, null, 2) + '\n');
console.log(`Built dist/reference: ${runtime.length} files, ${rawBytes} bytes (${gzipBytes} bytes gzip); no browser bundle.`);
