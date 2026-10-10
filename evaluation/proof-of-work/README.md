# Evidence status

This folder contains **actual locally executed results**, not model simulations.

- `reference.json`: all black-box checks against the reference on the local Node runtime.
- `mutants.json` and `mutants/M*.json`: executable mutation results, including failed assertion details. Each mutant runs its declared targeted checks after a fully passing baseline. A partial mutant score is not a complete benchmark score.
- `determinism.json`: three complete runs with identical check outcomes.
- `starter.json`: public starter baseline; this is **not** a model attempt.
- `demo.json`: end-to-end example with a forced restart and historical request replay.
- `generation-preflight.json`: setup status with zero model attempts.
- `submission-readiness.json`: an honest list of missing submission evidence.
- `lifecycle.json`: safe-reset checks, including rejection of source paths and symlink traversal.
- `security.json`: signature scan of working files, staged content and reachable Git-history blobs, plus environment-file ignore checks. Binary and Git-ignored files are excluded; a passing signature scan is not proof that arbitrary or encoded secrets are absent.
- `dependency-audit.json`: npm audit of application and development dependencies. The Python/OpenHands image dependencies have not been installed or audited here.

Docker is unavailable on the development machine. The Linux images and OpenHands integration are prepared but have not been executed here. Neither frontier-model attempt has been performed. There is **no evidence yet** that two frontier models score below 30%. Local success does not establish Linux-container durability or real-model difficulty.

Official container runs should create `reference-docker.json`, `mutants-docker.json`, `determinism-docker.json`, and separate `model-a/` and `model-b/` directories. Preserve every attempt, including failures. Do not tune the private tests after seeing model output or label an infrastructure failure as a model's low score.
