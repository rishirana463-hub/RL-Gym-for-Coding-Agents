# Failure-analysis status

Status on 2026-10-11: **unavailable; real evaluations requested but blocked by missing provider access**. Zero model attempts have occurred. Neither model has an identity, candidate implementation, trajectory or score. Consequently, no missed checks, causes of failure or task-fairness conclusions can be reported. [Recorded status](model-evaluation-status.json).

This document records missing work, not a model analysis. No per-model `ANALYSIS.md` files have been created. Reference success, mutation detections and the incomplete starter cannot explain how an unrun frontier model would perform.

## Required evidence for each actual analysis

After a genuine attempt, write `evals/<model-slug>-<identity-hash>/ANALYSIS.md` and preserve its equivalent as `evaluation/proof-of-work/model-a/failure-analysis.md` or `model-b/failure-analysis.md`, as applicable. Include:

- Exact model ID, reasoning setting, attempt limits, task/verifier fingerprints, execution status and links to the complete OpenHands logs, saved candidate and Docker score.
- Actual overall weighted score, component scores, passed/failed check IDs and any checks that did not execute. An incomplete or infrastructure-failed run is not a qualifying low score.
- For every missed check, its public instruction/acceptance criterion, expected behavior, observed behavior and relevant candidate code or trajectory evidence. Distinguish an observed cause from an inference; group shared causes while retaining every affected check ID.
- Whether each failure reflects an implementation defect against the stated contract, an ambiguous/missing requirement or verifier flaw, or an environment/provider/limit issue. Mark uncertainty explicitly. Reference and mutant success support verifier confidence but do not prove fairness for an unseen implementation.
- A conclusion on legitimate task difficulty versus task flaws, supported by those findings. If a flaw requires a new version, preserve the original attempt and follow the [difficulty protocol](DIFFICULTY.md); do not patch a scored candidate or erase its results.

Current result: **both requested per-model analyses are not done**. No model failure or fairness verdict has been invented.
