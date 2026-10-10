# Evidence status

This folder contains **actual local and Linux Docker results**, not model simulations.

- `reference.json`: all black-box checks against the reference on the local Node runtime.
- `reference-docker.json`: clean Linux container reference; 56/56, 100%.
- `mutants-docker.json`: clean Linux container baseline and all 18 mutants detected. Per-mutant container reports and full command logs are preserved under [evals/docker](../../evals/docker/README.md); existing `mutants/M*.json` remain the earlier local reports.
- `determinism-docker.json`: three complete 56/56 container runs with identical outcomes.
- `mutants.json` and `mutants/M*.json`: executable mutation results, including failed assertion details. Each mutant runs its declared targeted checks after a fully passing baseline. A partial mutant score is not a complete benchmark score.
- `determinism.json`: three complete runs with identical check outcomes.
- `starter.json`: public starter baseline; this is **not** a model attempt.
- `demo.json`: end-to-end example with a forced restart and historical request replay.
- `generation-preflight.json`: setup status with zero model attempts.
- `submission-readiness.json`: an honest list of missing submission evidence.
- `lifecycle.json`: safe-reset checks, including rejection of source paths and symlink traversal.
- `security.json`: signature scan of working files, staged content and reachable Git-history blobs, plus environment-file ignore checks. Binary and Git-ignored files are excluded; a passing signature scan is not proof that arbitrary or encoded secrets are absent.
- `dependency-audit.json`: npm audit of application and development dependencies. Python/OpenHands installation and dependency consistency now passed on the clean hosted runner; its vulnerability audit remains unperformed.

Docker is unavailable on the Windows development machine. Linux task-container validation passed on a clean GitHub-hosted runner; [provenance and full logs](../../evals/docker/README.md) record the source commit, runner, image inventory and artifact digest. [OpenHands image/offline setup validation](../../evals/openhands-preflight/README.md) passed with network disabled and zero model calls. Real provider integration remains pending. Neither frontier-model attempt has been performed. There is **no evidence yet** that two frontier models score below 30%.

Separate `model-a/` and `model-b/` directories must be created by actual model runs. Preserve every attempt, including failures. Do not tune the private tests after seeing model output or label an infrastructure failure as a model's low score.
