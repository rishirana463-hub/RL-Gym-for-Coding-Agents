# Stockroom RL Gym

A repository-level coding challenge to build a durable inventory and fulfillment API covering concurrency, partial shipments, transfers, returns, logical-clock expiry, retries, and crash recovery.

The reference passes **56/56 local checks** and the verifier catches **18/18 executable mutants**. Docker and both frontier-model attempts remain pending; the below-30% difficulty target is unproven. See the [actual evidence](evaluation/proof-of-work/README.md).

## Stack and setup

Node.js 24+ with standard-library-only application code; ESLint is the sole direct development dependency. Real model evaluations use Docker Linux containers with Python and OpenHands; no provider access is needed for local reference checks.

```sh
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

Supporting Vercel requires external durable transactional storage and revised concurrency handling before deployment configuration is added. A single container or VM with persistent storage matches the current design; Linux container execution remains unverified. No Vercel deployment has been performed.

## Further reading

- [Evaluation, lifecycle, and reference limits](docs/evaluation.md)
- [Production polish checks and measurements](docs/production-polish.md)
- [Submission checklist](SUBMISSION.md), including organizer approval and private repository access
