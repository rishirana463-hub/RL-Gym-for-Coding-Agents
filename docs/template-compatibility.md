# Official starter compatibility

Reviewed 2026-10-16 against [ProblemSetters' starter](https://github.com/ProblemSetters/earn-rl-gym-starter-template), commit `381889b5139b0c5f78da0ddcfa3f053719210c4b`. The organizer's announcement requires its format for greenfield and brownfield tasks. Stockroom is greenfield: a minimal runnable scaffold, not a feature added to an existing application.

## Format mapping

| Current authoring source | Official greenfield deliverable |
|---|---|
| Task metadata / limits | `greenfield/task.toml` |
| `task/instruction.md` | `greenfield/instruction.md` |
| `task/public/` | `greenfield/app/`, with `config.toml` setup/run commands |
| `environment/Dockerfile` | `greenfield/environment/Dockerfile` for the task; a separate verifier image may be used for isolation |
| `reference/` | `greenfield/reference-solution/` |
| `evaluation/tests/` and scorer support | `greenfield/verifier/`, with `tests/run_tests.py` honoring absolute `WORKSPACE`, `TASK_DIR`, `OUT_DIR` |
| Group weights on a 0-1 scale | Per-check points in `greenfield/verifier/scoring.yml`; `reward.json` on a 0-100 scale with unchanged relative credit |
| Executable source replacements | Independent `greenfield/verifier/mutants/*.patch` files |
| Reference/mutant evidence and future real model attempts | `greenfield/proof-of-work/` and `verifier/mutants/verifications/`; preserve original reports and provenance |

The planned export is deterministic and checked for drift. Existing authoring source remains authoritative; generated submission copies are distinct and must not be edited independently. Packaging does not turn old Docker evidence into evidence for a new adapter. The exported verifier/environment need their own execution records.

## Conflicting guidance and unproven requirements

- The [starter README](https://github.com/ProblemSetters/earn-rl-gym-starter-template/blob/381889b5139b0c5f78da0ddcfa3f053719210c4b/README.md) prefers high reasoning and ideally below 50%. Its [AGENTS.md](https://github.com/ProblemSetters/earn-rl-gym-starter-template/blob/381889b5139b0c5f78da0ddcfa3f053719210c4b/AGENTS.md) requires medium reasoning and below 30%, and describes a possible separate high-reasoning final assessment below 40%. These are different protocols; keep the existing medium / strictly below 30% submission gate until the organizer clarifies. No weights will be reduced to manufacture difficulty.
- Latest qualifying frontier versions must be verified at generation time. The template's model names are organizer guidance, not independent proof that a model is available or eligible. No model IDs or funded provider access are configured; the user's last answer confirmed they have none. Template examples explicitly marked synthetic are not Stockroom evidence and will not be copied.
- AGENTS.md asks for 7-8 core mutants plus 1-2 non-functional mutants. Stockroom has 18 existing mutants; retain them and flag the count difference rather than silently removing established coverage. Earlier mutant reports are targeted, incomplete scores: they prove detection but not each mutant's full-suite loss or the required loss-within-two-points comparison.
- The self-check asks for granular partial credit, functionality weights at most 25%, sub-checks at most 5%, and non-functional share at most 20%. Existing group weights are 12.5%, and individual checks are about 1.56-2.08%; non-functional classification and full-suite mutant effects need explicit review.
- Candidate-visible materials remain only `app/` and `instruction.md`. Reference, verifier, model logs and authoring guidance must not be mounted into the model workspace. Untrusted generated code must also be isolated during verification.
- Use scratch reference/app copies for the new self-check, preserve all outputs, and report missing proof without fabricated results. The completed legacy Docker/reference checks are not being rerun merely for a rename.

See [submission readiness](../SUBMISSION.md), [model access](model-access.md) and [progress](../PROGRESS.md). This review is not organizer approval or a claim of submission readiness.
