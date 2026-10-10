# Progress

Read this file first at the start of every session and continue from the outstanding work. Do not repeat Done items. Update Done / In progress / Next / Notes after each phase or meaningful step, before moving on, and commit the update with that work.

Last updated: 2026-10-11.

## Done

All six requested production-polish phases are complete. Each phase passed `npm run lint` and `npm run build` and has one commit.

| Phase | Completed work | Commit |
|---|---|---|
| 1 — Audit | Fixed aborted uploads, durability failure handling, unsafe reset paths, subprocess output and evidence validation; split oversized modules; added lint/build and focused regressions. | `9ad362e` |
| 2 — Responsive | Confirmed this is an API-only project. Recorded 360px, 768px and 1280px checks as not applicable. | `0576d9f` |
| 3 — Performance | Cached repeated state JSON with command invalidation; added freshness coverage and recorded a 33.61% lower median read time in the local benchmark. | `137a3a2` |
| 4 — Accessibility & SEO | Added noindex to JSON responses and verified response headers; recorded HTML accessibility/metadata checks as not applicable. | `50082aa` |
| 5 — Security | Isolated candidate environment variables, passed model credentials through stdin, preserved Docker client settings, added nosniff, secret scanning and environment/key-file exclusions. | `0d9a3be` |
| 6 — Docs | Wrote a concise README; preserved detailed evaluation/lifecycle instructions in a separate guide; documented Vercel storage limitations. | `643fc58` |

Recorded verification, already executed:

- Fresh `npm ci`, lint and build passed; npm audit reported zero known vulnerabilities, including development dependencies.
- 18 Node regression tests and two Python credential-input tests passed.
- Reference and built runtime each passed 56/56 private checks; all 18 executable mutants were detected; three complete reference runs had identical outcomes.
- Scoring metadata, lifecycle safety, documentation links/scripts, and working/staged/reachable-history secret-signature checks passed.
- The intentionally incomplete starter scored 0/56; this is not a model attempt or difficulty evidence.
- Final runtime size: 12,073 raw bytes / 4,498 gzip bytes; baseline: 11,048 / 3,954. There is no browser bundle.
- The handoff ZIP was verified against the exact tested source/verifier bytes. Windows line-ending conversion was avoided during packaging.
- Initialized and reviewed this root progress ledger from existing history and evidence, preserving all completed phase commits and outstanding prerequisites.
- GitHub README presentation prepared with accessible badges, capability/evidence tables, clone/setup instructions and documentation links. GitHub's Markdown renderer confirmed all four tables and badges; local links/scripts, lint/build and the outgoing secret scan passed. Completed reference/model checks were not rerun.
- Saved and independently verified the GitHub repository description: "A stateful software engineering benchmark for coding agents: durable inventory APIs, 56 black-box checks, 18 executable mutants, and a prepared one-pass OpenHands evaluation harness."
- Uploaded the complete existing project/history to [GitHub](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents) on `main`. Verified initial publication commit `228f176`, all 98 tracked files, the exact uploaded README bytes and repository description through GitHub's API. `origin/main` is configured as the local branch's upstream.
- Changed the GitHub repository to private on 2026-10-11 at the user's request. An independent GitHub API read confirmed both `private: true` and `visibility: private`.
- Gap step 1 completed: clean Linux Docker build/run on [Actions run 38079910504](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38079910504), source `97cce98`: reference 56/56 (100%), mutants 18/18 detected, three identical complete reference runs. Fresh install, lint/build, metadata and lifecycle passed. Downloaded complete logs/reports to `evals/docker/`, verified the artifact SHA-256 and every source/verifier fingerprint, and installed the three canonical Docker summaries under `evaluation/proof-of-work/`. No reference/test behavior changes were needed.
- Step 2 prerequisite completed: [OpenHands offline preflight 38080385852](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38080385852), source `292e7cd`, built the pinned image, passed dependency consistency, initialized SDK/tools/conversation and passed two credential tests in Linux. Full logs/package list/image identity are in `evals/openhands-preflight/`; downloaded artifact digest verified. Network-disabled setup made zero provider requests/model attempts. This does not complete the real-model evaluation requirement.
- Inspected the signed-in [HackerRank bounty](https://www.hackerrank.com/earn/applications/603). It does not list supplied model access/credits; it links HackerRank Experts Discord for coordination. The existing application already shows Submitted with this repo link. No submission edit was made.
- Completed the model-access investigation: inspected the user's Discord task thread and verified [Saurabh Maurya's original reply](https://discord.com/channels/1544210398180282380/1558107634698166384/1558380743925829733) explicitly declining API credits. The user then requested **leave real evaluations pending**. Zero model attempts/charges were initiated; no model scores or analyses exist. `docs/model-access.md` and `evals/README.md` record the evidence and limitations.
- Recorded step 3's unavailable difficulty assessment in `evals/DIFFICULTY.md`, including the strict below-30% gate and fair revision protocol. No task or scoring changes were made without real scores. The actual gate remains pending. Lint and build passed; runtime size remains 12,073 raw / 4,498 gzip bytes.
- Recorded step 4's unavailable analyses in `evals/FAILURE-ANALYSIS.md` and linked both pending records from the evaluation index. Actual per-model analyses cannot be written without candidate code, logs and scores; no placeholder model folders or failure claims were created. Lint and build passed.

## In progress

- Real evaluation steps 2-4 remain pending at the user's explicit request. Finishing the comprehensive submission checklist and organizer draft (step 5); no real model execution.
- Organizer guidance in Discord says higher reasoning and two accessible models; the live listing says medium reasoning and frontier models. Resolve this discrepancy before either real attempt. The existing harness retains medium reasoning pending clarification.
- Added a manual hosted-runner path for the two real evaluations because local Docker is absent. It requires two secure provider secrets, distinct confirmed model IDs and matching current Docker evidence, refuses workflow retries/saved attempt folders, and archives full generation/scoring/trajectory logs under model-specific `evals/` directories. It has not been dispatched; actual provider execution remains unverified. Preserve artifacts before any further dispatch.

## Next

1. Finish the exhaustive listing checklist and organizer draft (step 5).
2. When the user resumes real evaluations and provides access, confirm exact model eligibility/reasoning with the organizer, run each once, save full logs under model-specific `evals/` directories, and score saved solutions in Docker.
3. Apply the difficulty gate to real scores only. If needed, preserve attempts, revise the task fairly and rerun Docker plus both evaluations under a disclosed new version. Then write actual per-model failure analyses.
4. Obtain organizer idea approval and collaborator access; satisfy the automated/manual readiness gates before claiming acceptance-ready status.

## Notes

- This file was introduced after the six phase commits. Their completion was recovered from [the production polish record](docs/production-polish.md), Git history and [recorded evidence](evaluation/proof-of-work/README.md); those phases have not been rerun or rewritten. Future phase/step commits must include their progress update.
- Docker is unavailable on this Windows machine, but clean Linux Docker validation has now passed on GitHub Actions. No real frontier-model run has occurred. The submission-readiness check must continue to reject missing model evidence.
- There are no browser pages, CSS, images, React or Framer Motion. Viewport, tap-target, alt text, ARIA, focus and HTML meta/OG work was skipped as not applicable.
- ESLint is the only added direct development dependency. Runtime and starter code remain dependency-free.
- Secret scans inspect common signatures in text, not arbitrary/encoded secrets, binary files or ignored untracked files. Tracked files and reachable history remain scanned even when ignore rules match them. Local scoring is for trusted code; the environment filter is not a sandbox.
- The reference needs persistent storage and one writer per `DATA_DIR`. Snapshot/retry/audit history grows with workload; this is a correctness benchmark, not a production scalability claim.
- No deployment was performed. Vercel Functions would require external durable transactional storage and revised concurrency handling; that architecture change is outside the completed polish scope.
- The repository was initially public, then made private at the user's explicit request. Private visibility is verified; collaborator invitation/access and the other submission requirements remain outstanding.
- Resume from Next when its prerequisites are available. Reopen Done work only for a demonstrated regression or an explicitly requested change.
- Current requested order: Docker validation, two real OpenHands attempts, conditional difficulty revision, evidence-based failure analyses, then an exhaustive readiness checklist and organizer approval draft. Missing infrastructure/access must remain explicit; starter scores are never model results.
- Preserved the original user-supplied listing verbatim in `docs/bounty-listing.txt`. It specifies OpenHands, two frontier models, medium reasoning and one attempt each. Signed-in HackerRank/Discord inspection is complete; the organizer explicitly does not provide API credits.
- Normalized ten local `evaluation/tests/*.mjs` files to the exact LF bytes already stored in Git, after verifying that line endings were their only differences. This aligns raw verifier fingerprints with a clean Linux checkout without changing test logic. Earlier local reports retain their original byte fingerprints as historical evidence.
- Extended LF checkout rules to JSON/YAML/Markdown/Dockerfile inputs so future Windows checkouts preserve the raw source/verifier fingerprints used by Linux evidence. No fingerprinted content changed relative to the validated Git commit.
- OpenHands dependency consistency was executed; Python dependency vulnerability auditing and real provider/agent integration have not been executed. Offline preflight does not count toward the two frontier attempts.
