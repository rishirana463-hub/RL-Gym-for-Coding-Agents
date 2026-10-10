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

## In progress

- GitHub handoff: commit and push the prepared README/project history to the selected repository, then verify the remote branch and uploaded README. Local Git authentication confirms push/admin access; the target branch was empty before upload.

## Next

1. Push the prepared documentation/project history without overwriting remote work, verify the remote commit and README, and record the completed handoff in this ledger.
2. When Docker with Linux containers is available, execute the container reference, mutant and determinism checks documented in [the evaluation guide](docs/evaluation.md#container-verification). Review Linux bind-mount permissions and crash recovery during that work.
3. When access to two eligible frontier models is configured, run each once with the recorded limits, score its saved solution in Docker, and write failure analyses. Preserve all attempts. Both scores must be strictly below 30% to establish the task's difficulty requirement.
4. Install/audit the pinned Python/OpenHands image dependencies when the image can be built; this has not been verified locally.
5. Complete organizer approval, private repository/access requirements and the submission-readiness gate in [SUBMISSION.md](SUBMISSION.md) when the required evidence exists.

## Notes

- This file was introduced after the six phase commits. Their completion was recovered from [the production polish record](docs/production-polish.md), Git history and [recorded evidence](evaluation/proof-of-work/README.md); those phases have not been rerun or rewritten. Future phase/step commits must include their progress update.
- Docker is unavailable on this machine; no Linux container or real frontier-model runs have occurred. The submission-readiness check correctly reports missing container/model evidence.
- There are no browser pages, CSS, images, React or Framer Motion. Viewport, tap-target, alt text, ARIA, focus and HTML meta/OG work was skipped as not applicable.
- ESLint is the only added direct development dependency. Runtime and starter code remain dependency-free.
- Secret scans inspect common signatures in text, not arbitrary/encoded secrets, binary files or ignored untracked files. Tracked files and reachable history remain scanned even when ignore rules match them. Local scoring is for trusted code; the environment filter is not a sandbox.
- The reference needs persistent storage and one writer per `DATA_DIR`. Snapshot/retry/audit history grows with workload; this is a correctness benchmark, not a production scalability claim.
- No deployment was performed. Vercel Functions would require external durable transactional storage and revised concurrency handling; that architecture change is outside the completed polish scope.
- The user explicitly selected the existing public GitHub repository for this upload. Its visibility will be preserved; the organizer's private-repository submission requirement remains outstanding.
- Resume from Next when its prerequisites are available. Reopen Done work only for a demonstrated regression or an explicitly requested change.
