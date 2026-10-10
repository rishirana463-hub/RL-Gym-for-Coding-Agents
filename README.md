<div align="center">

<h1>Stockroom</h1>
<p><strong>A real-world software engineering RL gym for coding agents</strong></p>
<p>Durable inventory. Concurrent workflows. Verifiable outcomes.</p>

<img src="https://img.shields.io/badge/Node.js-24%2B-43853d?style=flat-square" alt="Requires Node.js 24 or newer">
<img src="https://img.shields.io/badge/runtime_dependencies-0-2563eb?style=flat-square" alt="Zero runtime dependencies">
<img src="https://img.shields.io/badge/local_checks-56%2F56-15803d?style=flat-square" alt="Reference passed 56 of 56 local checks">
<img src="https://img.shields.io/badge/mutants_detected-18%2F18-7c3aed?style=flat-square" alt="Verifier detected 18 of 18 executable mutants">

<p>
<a href="task/instruction.md">Task contract</a> &middot;
<a href="docs/evaluation.md">Evaluation guide</a> &middot;
<a href="evaluation/proof-of-work/README.md">Recorded evidence</a> &middot;
<a href="PROGRESS.md">Progress</a>
</p>

</div>

Stockroom is a repository-level coding benchmark in which an agent implements a persistent inventory and fulfillment API. Correctness must survive competing requests, partial workflows, retries, and abrupt process termination.

The repository includes a public task and starter, a working reference, a private verifier, executable fault variants, and a prepared one-pass OpenHands harness. Each layer has a defined role in [the evaluation boundary](docs/evaluation.md#layout-and-information-boundary).

## What the task covers

| Capability | What agents must handle |
|---|---|
| Inventory and fulfillment | Atomic multi-item reservations, partial shipments, cancellations, and cumulative returns |
| Warehouse transfers | Dispatch, partial receipt, cancellation, and stock conservation across locations |
| Concurrency and retries | Optimistic revisions, no overselling, and durable idempotent responses |
| Time and recovery | Explicit logical-clock expiry, persisted audit history, and recovery after forced termination |

## Evaluation status

| Evidence | Current result |
|---|---|
| Reference correctness | **56/56** local and Linux Docker checks passed |
| Verifier sensitivity | **18/18** executable mutants detected locally and in Docker |
| Determinism | Three complete Docker reference runs with identical outcomes |
| Linux containers | [Clean hosted-runner validation passed](evals/docker/README.md) |
| OpenHands integration | [Offline image/SDK setup passed](evals/openhands-preflight/README.md); real provider execution pending |
| Two frontier-model attempts | Not run; the **below-30% difficulty target is unproven** |

Badges summarize recorded local results, not live CI. See [proof of work](evaluation/proof-of-work/README.md) for the reports and their limitations. Do not expose the reference or verifier to an evaluated agent; provide only its designated public workspace.

## Quick start

Requires **Node.js 24+** and Git. The application uses only the Node standard library; ESLint is the sole direct development dependency. Docker, Python, and provider access are needed for real model evaluations, not local reference checks.

```sh
git clone https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents.git
cd RL-Gym-for-Coding-Agents
npm ci
npm run lint
npm run build
npm test
npm start
```

Use `npm.cmd` on Windows PowerShell if execution policy blocks `npm.ps1`. Stop the service with Ctrl+C. The build creates the dependency-free runtime in `dist/reference` and a raw/gzip size report in `dist/build-size.json`; it is not a browser bundle.

## API and configuration

| Setting | Default |
|---|---|
| `HOST` | `127.0.0.1` |
| `PORT` | `3000` |
| `DATA_DIR` | `.state`, resolved from the current working directory |

`GET /health` checks readiness; `GET /v1/state` reads inventory, orders, transfers, and audit history; `POST /v1/commands` applies commands. See the [complete API contract](task/instruction.md) for exact request/response shapes. Set configuration in the process environment; `.env` files are ignored by Git and are not loaded automatically.

The default URL is `http://127.0.0.1:3000`. The API has no authentication and is intended for controlled evaluation. Keep one writer per persistent `DATA_DIR`; snapshot and audit history grow with workload.

## Scripts

| Command | Purpose |
|---|---|
| `npm run lint` / `npm run build` | Check code; create the reference runtime artifact |
| `npm test` | Run focused tooling/API regressions |
| `npm run check:reference` | Run all private checks against the reference |
| `npm run check:mutants` | Verify detection of executable faults |
| `npm run check:determinism` | Compare three complete reference runs |
| `npm run check:metadata` / `npm run check:lifecycle` | Validate scoring metadata and safe reset |
| `npm run check:secrets` | Scan working/staged/history text for common secret signatures |
| `npm run demo` / `npm run benchmark` | Exercise recovery; measure repeated state-read latency |
| `npm run generate` / `npm run score` | Prepare/run OpenHands; score a selected solution |
| `npm run check:submission` | Check required evidence; intentionally fails while runs are missing |

Detailed flags, container commands, the public/private boundary, and the one-pass model protocol are in the [evaluation guide](docs/evaluation.md). Local scoring executes trusted code; use Docker for model-produced solutions.

## Vercel deploy

This reference cannot preserve its storage guarantees on Vercel Functions as-is: it requires durable `DATA_DIR` snapshots and one writer, while Functions provide a read-only filesystem and writable `/tmp` scratch space. See [Vercel's filesystem documentation](https://vercel.com/docs/functions/runtimes#file-system-support).

Supporting Vercel requires external durable transactional storage and revised concurrency handling before deployment configuration is added. A single container or VM with persistent storage matches the current design; Linux Docker reference validation passed on a clean hosted runner. No Vercel deployment has been performed.

## Further reading

- [Evaluation, lifecycle, and reference limits](docs/evaluation.md)
- [Production polish checks and measurements](docs/production-polish.md)
- [Progress and remaining work](PROGRESS.md)
- [Submission checklist](SUBMISSION.md), including organizer approval and private repository access
