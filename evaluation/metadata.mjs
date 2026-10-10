import assert from 'node:assert/strict';
import { cases } from './tests/cases.mjs';
import { read } from './util.mjs';

export function checkMetadata() {
  const scoring = read('evaluation/scoring.yml'), criteria = read('evaluation/acceptance-criteria.yml');
  assert.equal(scoring.schemaVersion, 1);
  const groups = Object.keys(scoring.groups);
  assert.ok(groups.every(g => scoring.groups[g].weight > 0 && scoring.groups[g].weight <= 1));
  const millionths = groups.map(g => scoring.groups[g].weight * 1_000_000);
  assert.ok(millionths.every(Number.isInteger)); assert.equal(millionths.reduce((a, b) => a + b, 0), 1_000_000);
  assert.equal(new Set(cases.map(x => x.id)).size, cases.length);
  assert.deepEqual(criteria.criteria.map(x => x.checkId).sort(), cases.map(x => x.id).sort());
  for (const g of groups) assert.ok(cases.some(x => x.group === g));
  for (const c of cases) {
    assert.ok(groups.includes(c.group)); const criterion = criteria.criteria.find(x => x.checkId === c.id);
    assert.equal(criterion.group, c.group); assert.ok(criterion.instructionSection && criterion.requirement);
  }
  return { checks: cases.length, groups: groups.length, weightSum: 1 };
}
if (process.argv[1]?.endsWith('metadata.mjs')) console.log(JSON.stringify(checkMetadata()));
