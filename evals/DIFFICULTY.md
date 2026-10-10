# Difficulty gate

Status on 2026-10-11: **not assessed**. The user requested that real evaluations remain pending. There have been zero model attempts; neither model has a score. See the [evaluation status](model-evaluation-status.json).

The reference passes 56/56 checks in Docker, all 18 mutants are detected, and three complete reference runs are stable. [Evidence](docker/README.md). These results establish reference solvability and verifier behavior; they do not establish model difficulty. The incomplete starter's score and the offline OpenHands preflight cannot substitute for model scores.

No task, instruction, verifier, scoring weight or reference behavior was changed for this gate. There is no evidence yet that a harder version is necessary or that the current version meets the listing's difficulty requirement.

## Apply after actual attempts

1. Confirm eligible model identities and resolve the listing's medium reasoning versus the organizer's higher reasoning guidance. Record the same disclosed limits and task/verifier version for both models.
2. Preserve each single-pass OpenHands attempt, full trajectory, generated source and complete Docker score. Setup/provider failures are not qualifying low scores; report them separately and ask the organizer how to proceed without silently retrying.
3. If both valid weighted scores are strictly below `0.30`, record that the gate passes. A score of exactly `0.30` fails the gate. Keep all passed and failed check results.
4. If either score is `0.30` or higher, preserve the original attempts and discuss a new task version and attempt protocol with the organizer. Add meaningful stateful behavior only through a clear public contract and matching acceptance criteria. Do not alter weights, omit successful checks or add hidden requirements to manufacture a lower score.
5. Validate the revised reference at 100% in clean Docker, catch all mutants and verify determinism. Run both eligible models once on the approved new version and retain both versions' evidence. Repeat the gate using the new scores.

Current result: **no pass/fail conclusion and no hardening performed**. Actual model evaluations and any conditional revision remain pending.
