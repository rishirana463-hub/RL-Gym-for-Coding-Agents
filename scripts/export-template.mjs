import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { root, files, args, sourceHash, verifierHash } from '../evaluation/util.mjs';
import { checkMetadata } from '../evaluation/metadata.mjs';
import { mutants } from '../evaluation/mutants/manifest.mjs';
import { sha256, scoringSchema, unifiedPatch, isolateHarness, packagedVerifierHash } from './template-schema.mjs';

function safeName(name) {
  if (name.split('/').some(part => ['.git', '.state', 'node_modules', 'dist', '__pycache__', '.venv'].includes(part) || /^\.env(?:\.|$)|\.(?:pem|key|sqlite(?:-.*)?|db)$/.test(part))) throw new Error(`Excluded dependency, data or secret path: ${name}`);
}

function exportFiles(directory, prefix = '') {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = prefix + entry.name, file = path.join(directory, entry.name);
    safeName(name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinked export content: ${name}`);
    if (entry.isDirectory()) result.push(...exportFiles(file, name + '/'));
    else if (entry.isFile()) result.push(name);
    else throw new Error(`Nonregular export content: ${name}`);
  }
  return result;
}

export function templateFiles() {
  checkMetadata();
  const entries = new Map();
  const put = (target, content) => { safeName(target); entries.set(target, Buffer.isBuffer(content) ? content : Buffer.from(content)); };
  const copy = (source, target) => put(target, fs.readFileSync(path.join(root, source)));
  const tree = (source, target) => {
    for (const file of files(path.join(root, source))) copy(path.relative(root, file), `${target}/${path.relative(path.join(root, source), file).replaceAll('\\', '/')}`);
  };
  copy('task/instruction.md', 'instruction.md');
  tree('task/public', 'app'); tree('reference', 'reference-solution');
  const templates = { 'task.toml': 'task.toml', 'README.md': 'README.md', 'Dockerfile': 'environment/Dockerfile',
    'verifier.Dockerfile': 'environment/verifier.Dockerfile', 'run_tests.py': 'verifier/tests/run_tests.py',
    'reward.py': 'verifier/tests/reward.py', 'proof-README.md': 'proof-of-work/README.md' };
  for (const [source, target] of Object.entries(templates)) copy(`scripts/template-files/${source}`, target);
  const privateRoot = 'verifier/implementation';
  tree('evaluation/tests', `${privateRoot}/evaluation/tests`);
  tree('app-setup', `${privateRoot}/app-setup`);
  for (const name of ['score.mjs', 'metadata.mjs', 'util.mjs', 'output.mjs', 'environment.mjs', 'scoring.yml', 'acceptance-criteria.yml']) copy(`evaluation/${name}`, `${privateRoot}/evaluation/${name}`);
  copy('environment/Dockerfile', `${privateRoot}/environment/Dockerfile`);
  copy('task/instruction.md', `${privateRoot}/task/instruction.md`);
  const harness = `${privateRoot}/evaluation/tests/harness.mjs`;
  put(harness, isolateHarness(entries.get(harness).toString('utf8')));
  put('verifier/scoring.yml', JSON.stringify(scoringSchema(), null, 2) + '\n');
  const descriptions = ['# Stockroom mutants', '', 'Apply each patch independently to a fresh reference copy with `git apply <absolute-patch-path>`. Never stack patches.', '',
    'The 18 original mutations are preserved. This exceeds the starter AGENTS target of 7–8 core plus 1–2 non-functional mutants; organizer review is required.',
    'Earlier targeted reports prove detection, not full-suite score loss. Full-run records, when executed, are stored under `verifications/<id>/1/` with an unmutated `control`. No expected full score is fabricated.', '',
    '| Patch | Defect | Original targeted checks |', '|---|---|---|'];
  for (const mutant of mutants) {
    const original = fs.readFileSync(path.join(root, 'reference', mutant.file), 'utf8');
    assert.equal(original.split(mutant.before).length - 1, 1, `${mutant.id}: expected one mutation site`);
    put(`verifier/mutants/${mutant.id}.patch`, unifiedPatch(mutant.file, original, original.replace(mutant.before, mutant.after)));
    descriptions.push(`| ${mutant.id}.patch | ${mutant.description} | ${mutant.checks.join(', ')} |`);
  }
  put('verifier/mutants/README.md', descriptions.join('\n') + '\n');
  const manifest = { schema_version: 1, task: 'stockroom', task_version: 1,
    official_template: { repository: 'https://github.com/ProblemSetters/earn-rl-gym-starter-template', commit: '381889b5139b0c5f78da0ddcfa3f053719210c4b' },
    authoring_reference_hash: sourceHash(path.join(root, 'reference')), authoring_verifier_hash: verifierHash(),
    instruction_sha256: sha256(entries.get('instruction.md')), packaged_verifier_hash: packagedVerifierHash(entries),
    files: Object.fromEntries([...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, content]) => [name, sha256(content)])) };
  put('template-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  return entries;
}

export function exportTemplate(destination, check = false) {
  const target = path.resolve(destination);
  const relative = path.relative(root, target);
  if (relative !== 'greenfield' && !relative.startsWith(`.runs${path.sep}`)) throw new Error('Export must be greenfield or a scratch directory below .runs');
  let existing = root;
  for (const part of relative.split(path.sep)) {
    existing = path.join(existing, part);
    if (fs.existsSync(existing) && fs.lstatSync(existing).isSymbolicLink()) throw new Error('Refusing a symlinked export path');
  }
  const present = exportFiles(target);
  if (!check && present.length && !present.includes('template-manifest.json')) throw new Error('Refusing to overwrite a directory without an export manifest');
  const entries = templateFiles(), stale = [];
  for (const [name, content] of entries) {
    const output = path.join(target, name);
    if (fs.existsSync(output) && (fs.lstatSync(output).isSymbolicLink() || !fs.lstatSync(output).isFile())) throw new Error(`Unsafe generated output: ${name}`);
    if (check) {
      if (!fs.existsSync(output) || !fs.readFileSync(output).equals(content)) stale.push(name);
    } else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, content);
      if (name.endsWith('.sh') || name === 'verifier/tests/run_tests.py') fs.chmodSync(output, 0o755);
    }
  }
  if (check && fs.existsSync(target)) {
    for (const name of present) {
      const evidence = (name.startsWith('proof-of-work/') && name !== 'proof-of-work/README.md') || name.startsWith('verifier/mutants/verifications/');
      if (!entries.has(name) && !evidence) stale.push(`Unexpected file: ${name}`);
    }
  }
  if (stale.length) throw new Error(`Template export is stale; run npm run export:template:\n${stale.join('\n')}`);
  return { directory: relative.replaceAll('\\', '/'), generatedFiles: entries.size, checked: check };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = args();
  console.log(JSON.stringify(exportTemplate(path.resolve(root, options.out ?? 'greenfield'), Boolean(options.check))));
}
