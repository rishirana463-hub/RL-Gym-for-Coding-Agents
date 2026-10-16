import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { cases } from '../evaluation/tests/cases.mjs';
import { read } from '../evaluation/util.mjs';

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

export function scoringSchema() {
  const groups = read('evaluation/scoring.yml').groups;
  const checks = cases.map(check => ({ id: check.id, title: check.description, group: check.group,
    points: 100 * groups[check.group].weight / cases.filter(c => c.group === check.group).length }));
  assert.ok(Math.abs(checks.reduce((sum, check) => sum + check.points, 0) - 100) < 1e-9);
  assert.ok(checks.every(check => check.points <= 5));
  return { schema_version: 1, task: 'stockroom', max_score: 100, reference_min_score: 100, baseline_max_score: 0, checks };
}

export function unifiedPatch(file, original, changed) {
  const before = original.trimEnd().split('\n'), after = changed.trimEnd().split('\n');
  let start = 0, tail = 0;
  while (start < before.length && before[start] === after[start]) start++;
  while (tail < before.length - start && tail < after.length - start && before.at(-tail - 1) === after.at(-tail - 1)) tail++;
  const head = Math.max(0, start - 3), context = Math.min(3, tail);
  const oldEnd = before.length - tail, newEnd = after.length - tail;
  const lines = [`--- a/${file}`, `+++ b/${file}`,
    `@@ -${head + 1},${oldEnd + context - head} +${head + 1},${newEnd + context - head} @@`,
    ...before.slice(head, start).map(line => ` ${line}`),
    ...before.slice(start, oldEnd).map(line => `-${line}`),
    ...after.slice(start, newEnd).map(line => `+${line}`),
    ...before.slice(oldEnd, oldEnd + context).map(line => ` ${line}`)];
  return lines.join('\n') + '\n';
}

export function isolateHarness(source) {
  const replace = (before, after) => {
    assert.equal(source.split(before).length - 1, 1, 'Isolation adapter must match exactly once');
    source = source.replace(before, after);
  };
  replace('  let child, base, container, launchError, output',
    "  const isolated = process.env.STOCKROOM_ISOLATE_CANDIDATE === '1';\n  if (isolated && process.getuid?.() !== 0) throw new ServiceInfrastructureError('Candidate UID isolation requires root verifier');\n  let child, base, container, launchError, output");
  replace("    else child.kill('SIGKILL');", "    else if (isolated) {\n      try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }\n    } else child.kill('SIGKILL');");
  replace("stdio: ['ignore', 'pipe', 'pipe'] });\n    }\n    const diagnostic",
    "stdio: ['ignore', 'pipe', 'pipe'], ...(isolated ? { uid: 10001, gid: 10001, detached: true } : {}) });\n    }\n    const diagnostic");
  replace("if (options.dockerImage && process.platform !== 'win32') fs.chmodSync(data, 0o777);",
    "if ((options.dockerImage || isolated) && process.platform !== 'win32') fs.chmodSync(data, 0o777);");
  return source;
}

export function packagedVerifierHash(entries) {
  const hash = crypto.createHash('sha256');
  const base = 'verifier/implementation/';
  const treeHash = prefix => {
    const tree = crypto.createHash('sha256');
    const traversal = (a, b) => {
      const left = a.split('/'), right = b.split('/');
      for (let i = 0; i < Math.min(left.length, right.length); i++) {
        if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
      }
      return left.length - right.length;
    };
    for (const name of [...entries.keys()].filter(name => name.startsWith(prefix)).sort(traversal)) {
      tree.update(name.slice(prefix.length)); tree.update('\0'); tree.update(entries.get(name)); tree.update('\0');
    }
    return tree.digest('hex');
  };
  hash.update(treeHash(`${base}evaluation/tests/`));
  for (const name of ['score.mjs', 'metadata.mjs', 'util.mjs', 'output.mjs', 'environment.mjs', 'scoring.yml', 'acceptance-criteria.yml']) {
    hash.update(name); hash.update('\0'); hash.update(entries.get(`${base}evaluation/${name}`));
  }
  hash.update(treeHash(`${base}app-setup/`));
  hash.update(entries.get(`${base}environment/Dockerfile`));
  hash.update(entries.get(`${base}task/instruction.md`));
  return hash.digest('hex');
}
