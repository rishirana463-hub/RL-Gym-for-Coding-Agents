import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { cases } from './tests/cases.mjs';
import { withService, ServiceInfrastructureError } from './tests/harness.mjs';
import { checkMetadata } from './metadata.mjs';
import { root, read, write, args, sourceHash, files, verifierHash } from './util.mjs';

export async function score(options) {
  checkMetadata();
  const solution = path.resolve(root, options.solution);
  const solutionHash = sourceHash(solution), checkHash = verifierHash();
  const scoring = read('evaluation/scoring.yml');
  const selected = options.only ? cases.filter(x => options.only.split(',').includes(x.id)) : cases;
  if (!selected.length || (options.only && selected.length !== new Set(options.only.split(',')).size)) throw new Error('Unknown/empty check selection');
  let dockerImage;
  if (options.docker) {
    dockerImage = `stockroom-score:${solutionHash.slice(0, 12)}`;
    const context = fs.mkdtempSync(path.join(os.tmpdir(), 'stockroom-build-'));
    try {
      fs.mkdirSync(path.join(context, 'task/public'), { recursive: true });
      for (const filename of files(solution)) {
        const target = path.join(context, 'task/public', path.relative(solution, filename));
        fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(filename, target);
      }
      fs.copyFileSync(path.join(root, 'task/instruction.md'), path.join(context, 'task/instruction.md'));
      fs.cpSync(path.join(root, 'app-setup'), path.join(context, 'app-setup'), { recursive: true });
      fs.copyFileSync(path.join(root, 'environment/Dockerfile'), path.join(context, 'Dockerfile'));
      const build = spawnSync('docker', ['build', '-t', dockerImage, context], { stdio: 'inherit' });
      if (build.error || build.status !== 0) throw new Error('Docker build failed; no score was produced');
    } finally { fs.rmSync(context, { recursive: true, force: true }); }
  }
  const results = [];
  for (const check of selected) {
    let passed = true, error;
    try { await withService({ solution, dockerImage }, check.run); }
    catch (e) {
      if (e instanceof ServiceInfrastructureError) throw e;
      passed = false; error = e.stack ?? String(e);
    }
    results.push({ id: check.id, group: check.group, description: check.description, passed, ...(error ? { error } : {}) });
    if (!options.quiet) console.log(`${passed ? 'PASS' : 'FAIL'} ${check.id} ${check.description}`);
  }
  const groups = {};
  let total = 0;
  for (const [name, config] of Object.entries(scoring.groups)) {
    const checks = results.filter(x => x.group === name), all = cases.filter(x => x.group === name);
    const passed = checks.filter(x => x.passed).length, weightedScore = config.weight * passed / all.length;
    groups[name] = { weight: config.weight, passed, total: all.length, executed: checks.length, weightedScore };
    total += weightedScore;
  }
  const report = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), solution: path.relative(root, solution).replaceAll('\\', '/'),
    solutionHash, checkHash, node: process.version, platform: process.platform,
    execution: options.docker ? 'docker' : 'local', complete: results.length === cases.length,
    score: Number(total.toFixed(12)), passed: results.filter(x => x.passed).length, total: cases.length, executed: results.length, groups, checks: results
  };
  if (options.out) write(options.out, report);
  return report;
}
if (process.argv[1]?.endsWith('score.mjs')) {
  const options = args();
  if (!options.solution) throw new Error('Specify --solution <directory>; the scorer never silently substitutes the reference');
  options.out ??= 'evaluation/proof-of-work/last-score.json';
  const report = await score(options);
  console.log(`Score: ${(report.score * 100).toFixed(2)}% (${report.passed}/${report.total}; ${report.execution})`);
  if (options['require-perfect'] && (report.score !== 1 || !report.complete)) process.exitCode = 1;
}
