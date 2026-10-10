import fs from 'node:fs';
import path from 'node:path';
import { root, read, write, sourceHash, verifierHash } from './util.mjs';
import { checkMetadata } from './metadata.mjs';
import { validateDeterminismEvidence } from './evidence.mjs';

const { checks } = checkMetadata();
const issues = [];
function requireProof(file, check) {
  if (!fs.existsSync(path.join(root, file))) { issues.push(`Missing ${file}`); return; }
  try { check(read(file)); } catch (e) { issues.push(`${file}: ${e.message}`); }
}
const require = (condition, message) => { if (!condition) throw new Error(message); };
requireProof('evaluation/proof-of-work/reference-docker.json', r => {
  require(r.complete && r.score === 1 && r.execution === 'docker', 'Need complete 100% container reference result');
  require(r.solutionHash === sourceHash(path.join(root, 'reference')), 'Reference evidence is stale');
  require(r.checkHash === verifierHash(), 'Verifier evidence is stale');
});
requireProof('evaluation/proof-of-work/mutants-docker.json', r => {
  require(r.execution === 'docker' && r.killed === r.total && r.total >= 18, 'Need all mutants caught in containers');
  require(r.baseline.solutionHash === sourceHash(path.join(root, 'reference')), 'Mutant baseline is stale');
  require(r.baseline.checkHash === verifierHash(), 'Mutant verifier evidence is stale');
});
requireProof('evaluation/proof-of-work/determinism-docker.json', r => {
  validateDeterminismEvidence(r, { solutionHash: sourceHash(path.join(root, 'reference')), checkHash: verifierHash(), checks });
});
const models = [];
for (const id of ['model-a', 'model-b']) {
  let run;
  requireProof(`evaluation/proof-of-work/${id}/run.json`, r => {
    require(r.status === 'completed' && r.attempt === 1 && r.reasoningEffort === 'medium' && r.frontierAttestation, 'Need a completed, attested frontier single-pass medium run');
    require(r.privateAssetsExposed === false, 'Private assets were exposed'); models.push(r.model); run = r;
    require(r.solutionDirectory && sourceHash(path.resolve(root, r.solutionDirectory)) === r.solutionHash, 'Missing or changed saved model source');
  });
  requireProof(`evaluation/proof-of-work/${id}/score.json`, r => {
    require(r.complete && r.execution === 'docker' && r.score < 0.30, 'Need a complete container score strictly below 30%');
    require(run && r.solutionHash === run.solutionHash, 'Scored solution must match generated artifact');
    require(r.checkHash === verifierHash(), 'Model verifier evidence is stale');
  });
  for (const file of ['openhands.log', 'failure-analysis.md']) if (!fs.existsSync(path.join(root, 'evaluation/proof-of-work', id, file))) issues.push(`Missing ${id}/${file}`);
}
if (models.length === 2 && models[0] === models[1]) issues.push('Two different models are required');
write('evaluation/proof-of-work/submission-readiness.json', { generatedAt: new Date().toISOString(), automatedChecksReady: issues.length === 0, issues, manualRequirements: ['Organizer task-idea approval', 'Private GitHub repository', 'Verified collaborator invitation/access for content.team@problemsetters.com', 'Frontier-model eligibility verified with organizer'] });
console.log(issues.length ? `Not submission-ready:\n${issues.map(x => `- ${x}`).join('\n')}` : 'Automated evidence checks passed. Verify the recorded manual requirements before submission.');
if (issues.length) process.exitCode = 1;
