# Clean Docker validation

Actual execution: [GitHub Actions run 38079910504](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38079910504), attempt 1, source `97cce989937c4d54601b64377e0db5712852e8ed`. A fresh Ubuntu 24.04 runner used Node 24.14.0 and Docker 28.0.4. No Stockroom image existed before the run; the pinned base image was downloaded and the reference image built from the isolated public-only context.

| Check | Result |
|---|---|
| Reference | 56/56; complete score 100% |
| Mutants | 18/18 detected; passing 56/56 baseline |
| Determinism | Three complete 56/56 reference runs; identical outcomes |
| Tooling | Fresh dependency installation, lint, build, metadata and lifecycle checks passed |

`logs/` contains complete command output, Docker versions and before/after image inventories. `reports/` preserves the downloaded reference, mutant (including each targeted assertion failure) and determinism JSON. The three summary reports also appear in the listing-required `evaluation/proof-of-work/` location. Earlier local mutant reports were retained separately.

`provenance.json` records runner/source fingerprints; `download.json` records artifact identity and SHA-256, independently matched to GitHub's artifact digest. Imported report fingerprints match the current reference and verifier. The original ZIP is retained locally under ignored `.runs/`.

Every verifier check creates a fresh container and state directory. Crash/retry checks deliberately reuse their own directory during restarts. Linux bind-mount write permissions, non-root execution and process-crash recovery passed these checks. This does not test hardware power loss or Windows Docker Desktop.

Follow-up CI [38930130107](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38930130107) succeeded on source `032d100`, including the clean-checkout guard, tooling, reference, mutant and three-run determinism steps. Its [GitHub status record](follow-up-38930130107.json), observed 2026-10-17, records step conclusions only. It does not replace the original raw logs/reports above or the [official-format full-suite evidence](../template-self-check/README.md).

Reproduce with the [workflow](../../.github/workflows/docker-validation.yml) or the [container commands](../../docs/evaluation.md#container-verification). Model attempts: **zero**. These are reference/mutant results, not frontier-model scores.
