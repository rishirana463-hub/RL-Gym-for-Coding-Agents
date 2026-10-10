import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mutants } from './manifest.mjs';
import { score } from '../score.mjs';
import { root, write, args } from '../util.mjs';

const options = args();
const baseline = await score({ solution: 'reference', docker: options.docker, quiet: true });
assert.equal(baseline.score, 1, 'Mutation testing requires a fully passing baseline');
const results = [];
for (const mutant of mutants) {
  const directory = path.join(root, '.runs/mutants', mutant.id);
  // This fixed path is generated exclusively by this script; preserve old runs instead of deleting them.
  fs.mkdirSync(directory, { recursive: true });
  fs.cpSync(path.join(root, 'reference'), directory, { recursive: true });
  const filename = path.join(directory, mutant.file);
  const original = fs.readFileSync(filename, 'utf8');
  assert.equal(original.split(mutant.before).length - 1, 1, `${mutant.id}: patch must have exactly one match`);
  fs.writeFileSync(filename, original.replace(mutant.before, mutant.after));
  const syntax = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, `${mutant.id}: invalid syntax does not count as a killed mutant`);
  const report = await score({ solution: directory, only: mutant.checks.join(','), docker: options.docker, quiet: true });
  const detectedBy = report.checks.filter(x => !x.passed).map(x => x.id);
  const killed = detectedBy.length > 0;
  results.push({ ...mutant, syntaxValid: true, killed, detectedBy, solutionHash: report.solutionHash });
  write(`evaluation/proof-of-work/mutants/${mutant.id}.json`, report);
  console.log(`${killed ? 'KILLED' : 'SURVIVED'} ${mutant.id}: ${mutant.description} (${detectedBy.join(', ')})`);
}
write(options.out ?? `evaluation/proof-of-work/mutants${options.docker ? '-docker' : ''}.json`, { generatedAt: new Date().toISOString(), execution: baseline.execution, baseline: { passed: baseline.passed, total: baseline.total, solutionHash: baseline.solutionHash, checkHash: baseline.checkHash }, total: results.length, killed: results.filter(x => x.killed).length, mutants: results });
if (results.some(x => !x.killed)) process.exitCode = 1;
