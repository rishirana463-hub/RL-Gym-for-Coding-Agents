import assert from 'node:assert/strict';
import { score } from './score.mjs';
import { args, write } from './util.mjs';

const options = args(); const runs = [];
for (let i = 0; i < 3; i++) {
  const report = await score({ solution: options.solution ?? 'reference', docker: options.docker, quiet: true });
  runs.push(report); console.log(`Determinism pass ${i + 1}: ${report.passed}/${report.total}`);
}
const signatures = runs.map(r => ({ solutionHash: r.solutionHash, checkHash: r.checkHash, score: r.score, checks: r.checks.map(x => [x.id, x.passed]) }));
assert.deepEqual(signatures[0], signatures[1]); assert.deepEqual(signatures[1], signatures[2]);
assert.equal(runs[0].score, 1);
write(options.out ?? `evaluation/proof-of-work/determinism${options.docker ? '-docker' : ''}.json`, { stable: true, repetitions: 3, execution: runs[0].execution, runs: runs.map(({ generatedAt, score, passed, total, solutionHash, checkHash }) => ({ generatedAt, score, passed, total, solutionHash, checkHash })) });
