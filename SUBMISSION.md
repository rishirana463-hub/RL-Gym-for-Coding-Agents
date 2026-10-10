# Submission readiness

Checked 2026-10-11 against the [original listing](docs/bounty-listing.txt) and the signed-in [HackerRank application](https://www.hackerrank.com/earn/applications/603). **Not submission-ready:** the user requested real model evaluations but confirmed they have no provider access; model/reasoning confirmation and organizer approval/access are outstanding. Docker reference and mutant validation are complete.

**Done** means the listed artifact exists or the stated check actually passed. **Not done** means evidence or work is missing. **Needs human** means organizer confirmation, account access or a human decision is required. Prepared tooling is not a completed model evaluation.

## Task and verifier

| Listing requirement | Status | Evidence / remaining work |
|---|---|---|
| Different repository-level application with meaningful stateful workflows, edge cases and failure scenarios | Done (implementation) | [Stockroom contract](task/instruction.md): atomic reservations, partial fulfillment/cancellation, cumulative returns, warehouse transfers, logical expiry, revisions, retries and crash recovery. Organizer acceptance of this scope is separate below. |
| Share the idea and obtain approval **before implementation** | Needs human | No approval was found in the user's task thread. The prototype is already built, so the original ordering was not met. Ask whether the organizer will review/accept the existing prototype; do not claim retrospective compliance. Confirm the warehouse/inventory scope is distinct enough from existing tasks. |
| Precise observable instructions and error handling, with internal architecture left open | Done | [task/instruction.md](task/instruction.md) specifies HTTP behavior, state invariants, validation order and recovery without requiring a storage/code architecture. |
| Public starter or existing codebase | Done | [task/public](task/public/) contains the runnable incomplete starter and public smoke check. Its baseline is not a model result. |
| Complete reference solution, 100% of score-bearing checks | Done | [reference](reference/); [Docker report](evaluation/proof-of-work/reference-docker.json): 56/56, complete score 1.0. |
| Hidden black-box unit/integration verification of external behavior | Done | [56 checks](evaluation/tests/) interact through HTTP and process lifecycle; they do not inspect candidate internals. |
| Acceptance criteria map observable requirements to verifier IDs | Done | [acceptance-criteria.yml](evaluation/acceptance-criteria.yml): all 56 check IDs mapped. Metadata validation passed. |
| Scoring component weights sum to exactly 1.0 | Done | [scoring.yml](evaluation/scoring.yml): eight components, each 0.125. Metadata validation passed. |
| Realistic executable mutants; every mutant caught | Done | [Mutation definitions](evaluation/mutants/manifest.mjs), [Docker aggregate](evaluation/proof-of-work/mutants-docker.json) and [individual failures](evals/docker/reports/mutants/): 18/18 detected after a fully passing baseline. |
| Repeated verifier runs are stable | Done | [Docker determinism](evaluation/proof-of-work/determinism-docker.json): three complete 56/56 runs with identical outcomes. |
| Private verifier assets isolated from model-facing directories | Done (implemented boundary) | [Information boundary](docs/evaluation.md#layout-and-information-boundary); scoring image built from solution/public instruction/lifecycle files only, tests stay on the host. Generator prepares only the starter and public instruction. Actual provider/agent execution remains untested. |

The Excalidraw drawing/editing/export/collaboration features in the listing are explicitly an **example**, not mandatory Stockroom features. They were not implemented; the organizer must judge comparable depth and approve this different application.

## Repository, environment and lifecycle

| Listing requirement | Status | Evidence / remaining work |
|---|---|---|
| One private GitHub repository | Done | [Repository](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents); GitHub API rechecked `private: true`, `visibility: private` on 2026-10-11. It was initially public before the user's privacy request; do not describe it as always private. |
| `task/instruction.md` and `task/public/` | Done | [Instructions](task/instruction.md), [public materials](task/public/). |
| `environment/Dockerfile` | Done | [Pinned task image](environment/Dockerfile); built and run on a fresh Linux hosted runner. |
| `reference/` | Done | [Reference source](reference/) and complete [Docker proof](evaluation/proof-of-work/reference-docker.json). |
| `evaluation/tests/`, `acceptance-criteria.yml`, `scoring.yml` | Done | [Verifier](evaluation/tests/), [criteria](evaluation/acceptance-criteria.yml), [weights](evaluation/scoring.yml). |
| `evaluation/proof-of-work/` with reference runs and mutant outputs | Done | [Evidence index](evaluation/proof-of-work/README.md), canonical Docker summaries and [full container logs/reports](evals/docker/README.md). Model evidence is still missing below. |
| `app-setup/build.sh`, `start.sh`, `reset.sh` | Done (implementation/core validation) | [Build](app-setup/build.sh), [start](app-setup/start.sh), [reset](app-setup/reset.sh); shared build/reset logic and lifecycle safety passed on Linux, container build/runtime passed. Direct invocation of all three shell wrappers inside Docker was not separately recorded. |
| Root private package configuration and `generate`, `score`, `check:mutants`, `check:reference` commands | Done (implementation) | [package.json](package.json); scoring/reference/mutants executed. Real-provider `generate` execution is pending. |
| Clean reproducible task sandbox; fresh container/state for every run | Done (scoring/reference) | [Clean-run provenance](evals/docker/README.md), [Docker runner](evaluation/docker-environment.mjs). Each check starts fresh; recovery checks deliberately preserve their own state across process restarts. |
| Model works in the sandbox and its generated solution builds/runs there | Not done (end-to-end) | Matching pinned Node runtime and [OpenHands image](environment/openhands/Dockerfile) are prepared; [offline image/SDK preflight](evals/openhands-preflight/README.md) passed. No actual model-produced solution has been generated or run. |
| Lifecycle builds/prepares solution, starts runtime and safely resets generated state | Done (core validation) | [Lifecycle core](app-setup/lifecycle.mjs), [safety report](evaluation/proof-of-work/lifecycle.json), clean Linux checks and Docker runtime results. Reset refuses source/symlink paths; the external `/data` default uses a fresh container/volume. Shell-wrapper limitation noted above. |

Docker is unavailable on the Windows development machine. Validation used [GitHub Actions run 38079910504](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38079910504), source `97cce98`, with verified downloaded artifact digest and source/verifier fingerprints. Later documentation changes do not alter the validated reference/verifier. No Windows Docker result is claimed.

## Real model evidence and difficulty

| Listing requirement / requested gap | Status | Evidence / remaining work |
|---|---|---|
| Two different organizer-eligible frontier models | Needs human | No model IDs selected. The organizer permits two accessible models in [Discord guidance](https://discord.com/channels/1544210398180282380/1558107634698166384/1558380743925829733), while the listing specifies frontier models. Confirm eligibility. |
| Medium reasoning as specified in the listing | Needs human | The organizer's reply asks for higher reasoning. Resolve this difference before either attempt; current harness/readiness gate retain medium. An approved change requires updating and validating both before running. |
| Provider access for real OpenHands runs | Needs human | The organizer explicitly does not provide API credits. The user requested resumption but confirmed they have no provider access. Fresh local presence checks and GitHub Actions metadata show no configured credentials. Ask whether an approved evaluator or alternative is accepted. [Access findings](docs/model-access.md). |
| Model A: one single-pass OpenHands attempt using `npm run generate` | Not done | Zero attempts; no model identity, candidate or trajectory. [Recorded status](evals/model-evaluation-status.json). |
| Model B: one single-pass OpenHands attempt using `npm run generate` | Not done | Zero attempts; no model identity, candidate or trajectory. The [manual workflow](.github/workflows/model-evaluation.yml) is prepared but has not run with real credentials. |
| Score both saved generated solutions in fresh Docker using `npm run score` | Not done | No generated candidates exist. Both scores are **unavailable**, not zero. Preserve identical disclosed settings and source/verifier fingerprints. |
| Both complete valid weighted scores strictly below 30% | Not done | No evidence yet. Setup failures, starter scores and offline placeholders cannot count. |
| Record model names, full OpenHands logs, scores and failure categories in `evaluation/proof-of-work/` | Not done | Eight required files are absent: `run.json`, `score.json`, `openhands.log`, `failure-analysis.md` for each of `model-a` and `model-b`. Source snapshots must accompany actual attempts. |
| Save full logs under model-specific `evals/<model>/` paths | Not done | Hosted workflow prepares `evals/<model-slug>-<identity-hash>/`; no fake model directories were created. Preserve every real attempt, including unsuccessful ones. |
| Assess the difficulty gate; fairly revise if either score is 30% or higher, then rerun Docker and both models | Not done (conditional) | [Gate status/protocol](evals/DIFFICULTY.md). No scores exist, so no hardening decision or revision was made. Preserve old versions/attempts and agree on a new-version protocol before rerunning. |
| Actual per-model `ANALYSIS.md`: causes, missed checks, legitimate difficulty versus task flaws | Not done | [Analysis status](evals/FAILURE-ANALYSIS.md); cannot infer failures without actual logs, candidate code and scores. Preserve equivalent canonical `failure-analysis.md` files. |

## Access, approval and handoff

| Requirement / action | Status | Evidence / remaining work |
|---|---|---|
| Collaborator access for `content.team@problemsetters.com` | Needs human | GitHub API recheck found zero outside collaborators and zero pending invitations. Ask for the exact GitHub account/invitation route and verify accepted access. No invitation was sent. |
| Short organizer message requesting idea approval | Done (draft only) | [Approval/clarification draft](docs/organizer-message.md). No Discord/email message was sent. |
| Automated submission-readiness gate | Not done | [Readiness report](evaluation/proof-of-work/submission-readiness.json) intentionally rejects the eight missing model files. Current reference/mutant/determinism fingerprints pass. Manual requirements still apply after automated success. |
| Repository link on the HackerRank application | Done (existing application) | Signed-in application already displays **Submitted**, dated Oct 10, with this repo link. This was observed, not edited. It does not establish readiness, approval, acceptance or payment. |

The listing offers **$800 fixed price**. Acceptance and payment are organizer decisions; technical reference success alone does not establish eligibility for payment. The user has requested real evaluations; execution requires the access/eligibility/reasoning prerequisites to be settled. No evaluator arrangement or waiver has been granted.
