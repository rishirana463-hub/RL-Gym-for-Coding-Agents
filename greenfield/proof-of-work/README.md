# Proof-of-work status

There have been **zero real model attempts**. No model folders, trajectories or numeric model scores are supplied. The user requested evaluations but confirmed they have no provider access; the organizer does not provide API credits.

Reference and starter self-check records, when actually executed, are stored separately under `reference/` and `starter/`. They are not model attempts. Mutant measurements belong under `../verifier/mutants/verifications/`. Each actual adapter result records the generated template-manifest hash, source/verifier fingerprints and execution mode. Preserve command logs and scratch-copy provenance.

Future model records must contain `solution/`, `metadata.json`, actual `trajectory.jsonl`, and `verifications/<number>/reward.json` plus `verifier.log`. The model directory is named `<model>-<reasoning>-<UTC-timestamp>` without its provider prefix. Metadata must record exact model ID/version, reasoning, one-pass limits, generation times, the instruction and verifier version, and actual completion status. Preserve unsuccessful attempts too. Write `ANALYSIS.md` from the candidate, trajectory and failed checks only.

The parent repository preserves the earlier full Docker evidence and its provenance; those reports do not certify this new wrapper/image. Never relabel an old run or a template example as a new verification or model attempt.
