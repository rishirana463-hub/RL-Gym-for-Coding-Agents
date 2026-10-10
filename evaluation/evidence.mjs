import assert from 'node:assert/strict';

export function validateDeterminismEvidence(report, { solutionHash, checkHash, checks }) {
  assert.ok(report.stable && report.execution === 'docker', 'Need stable container runs');
  assert.ok(Number.isInteger(report.repetitions) && report.repetitions >= 3, 'Need at least three repetitions');
  assert.ok(Array.isArray(report.runs) && report.runs.length === report.repetitions, 'Missing determinism runs');
  for (const run of report.runs) {
    assert.equal(run.score, 1, 'Determinism runs must pass completely');
    assert.equal(run.total, checks, 'Determinism check count is stale');
    assert.equal(run.passed, checks, 'Determinism run is incomplete');
    assert.equal(run.solutionHash, solutionHash, 'Determinism source is stale');
    assert.equal(run.checkHash, checkHash, 'Determinism verifier is stale');
  }
}
