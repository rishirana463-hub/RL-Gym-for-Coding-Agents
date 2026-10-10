# Stockroom RL Gym

A repository-level coding challenge: build a durable inventory and fulfillment service that remains correct across concurrent requests, partial shipments, transfer reconciliation, returns, logical-clock expiry, retries, and abrupt process termination.

The reference currently passes **56/56 local black-box checks**. The verifier catches **18/18 executable fault variants**. Actual evidence lives in [evaluation/proof-of-work](evaluation/proof-of-work/README.md). Container execution and the two frontier-model evaluations are still pending. This project must not be presented as meeting the below-30% difficulty target until those runs exist.

## Run locally

Requires Node.js 24 or newer. There are no application dependencies to install.

```sh
npm run check:reference
npm run check:mutants
npm run check:determinism
npm run check:metadata
npm run check:lifecycle
npm run demo
npm start
```

The service listens at `http://127.0.0.1:3000`. `GET /v1/state` returns the inventory, orders, transfers, and audit trail. Commands go to `POST /v1/commands`. See [the complete contract](task/instruction.md) for examples and exact response shapes. Stop the service with Ctrl+C. Set DATA_DIR to choose its persistent state location.

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

## Layout and information boundary

| Path | Purpose | Agent access |
|---|---|---|
| `task/instruction.md` | Complete observable behavior contract | Yes |
| `task/public/` | Deliberately incomplete runnable starter and public smoke check | Yes |
| `environment/Dockerfile` | Pinned Node task environment | Runtime only |
| `reference/` | Working reference service | No |
| `evaluation/tests/` | Private HTTP/process verifier | No |
| `evaluation/acceptance-criteria.yml` | Requirement-to-check mapping | No |
| `evaluation/scoring.yml` | Eight component weights totaling exactly 1.0 | No |
| `evaluation/mutants/` | Executable source mutations and checker | No |
| `evaluation/proof-of-work/` | Recorded runs and failures | No |
| `app-setup/` | Build, start and reset lifecycle scripts | Runtime only |

The `.yml` configuration files use JSON syntax, which is valid YAML 1.2, to avoid parser dependencies. Each component contributes 0.125 times its fraction of passing checks. Every check is all-or-nothing. The scorer reports a complete score only when all checks execute.

## Container verification

Install Docker Desktop with Linux containers, then run from the repository root:

```sh
npm run check:reference -- --docker --out evaluation/proof-of-work/reference-docker.json
npm run check:mutants -- --docker
npm run check:determinism -- --docker
```

The scorer builds from a temporary context containing **only the selected solution, public instruction, and lifecycle scripts**. Each check starts a fresh container and fresh state directory. Recovery scenarios intentionally restart the service using the same state directory. Private tests stay on the host and interact through HTTP. The server runs as an unprivileged user.

Local checks launch trusted code directly for convenience. Use `--docker` when evaluating agent-produced solutions. The model generation container only receives a writable starter workspace. It never receives this repository, the reference, hidden tests, Docker socket, or proof directory. Internet access is retained for the configured LLM provider; no public hosting is needed.

## One-pass OpenHands evaluation

The runner uses the [official OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk), pinned to 1.54.0, with terminal and file-editing tools. Its reasoning setting follows [OpenHands' documented `reasoning_effort` option](https://docs.openhands.dev/sdk/guides/llm-reasoning). One attempt means one instruction message and one conversation run; normal tool/LLM turns within that run are allowed.

```sh
# No credentials needed: inspect setup and prepare a public-only workspace.
npm run generate -- --prepare

# Set LLM_API_KEY securely in your local environment before actual runs.
# Optional: set LLM_BASE_URL for the chosen provider.
npm run generate -- --run model-a --model PROVIDER/MODEL_A --frontier-confirmed
npm run score -- --solution evaluation/proof-of-work/model-a/solution --docker --out evaluation/proof-of-work/model-a/score.json

# Set the appropriate provider credentials for the second, different model.
npm run generate -- --run model-b --model PROVIDER/MODEL_B --frontier-confirmed
npm run score -- --solution evaluation/proof-of-work/model-b/solution --docker --out evaluation/proof-of-work/model-b/score.json
```

Replace the uppercase placeholders with actual eligible frontier model IDs supporting medium reasoning. Confirm eligibility with the organizer; the script cannot establish that a model is frontier-class. `--frontier-confirmed` records that operator attestation. Defaults are 100 agent iterations and 1,800 seconds per attempt; use the same disclosed limits for both models. API usage incurs the provider's charges. The wall-clock timer stops the container. The iteration limit is enforced by OpenHands. SDK request-level retries are distinct from starting another task attempt.

The runner refuses to overwrite an attempt folder. Do not retry, patch, resume, or feed hidden failures back to a scored candidate. It saves model identity, reasoning level, source hashes, image ID, trajectory, and execution status. Infrastructure errors and timeouts are reported explicitly and cannot satisfy the submission checker. Logs redact the configured API key. Do not put credentials in the repository.

After each run, create `failure-analysis.md` in its proof directory. Describe actual failed components using its score report. The runner automatically saves candidate source under that proof directory's `solution/`, outside the model sandbox. The scratch `.runs` directory is intentionally ignored by Git.

If either model scores 30% or higher, the challenge has **not** met the difficulty requirement. Discuss a new task version and evaluation protocol with the organizer; preserve the existing attempts. Do not change score weights or hide successful checks to manufacture a qualifying score.

## Lifecycle

Inside a solution workspace:

```sh
SOLUTION_DIR="$PWD" /opt/app-setup/build.sh
SOLUTION_DIR="$PWD" DATA_DIR="$PWD/.state" /opt/app-setup/reset.sh
SOLUTION_DIR="$PWD" DATA_DIR="$PWD/.state" /opt/app-setup/start.sh
```

Build checks all `.mjs` source files. Start replaces the shell with the service. Reset clears a strictly nested DATA_DIR and refuses source directories or symlink traversal. For the default container `/data` volume, use a fresh volume/container rather than resetting a path outside SOLUTION_DIR. Cross-platform equivalents are `node app-setup/lifecycle.mjs build reference` and `node app-setup/lifecycle.mjs reset reference`.

## Reference design and limits

The reference serializes transactions in one Node event loop. It validates and applies each command to an isolated state copy, then commits the entire state and retry ledger through a flushed temporary file and atomic rename. On Linux it also flushes the directory entry. Historical replay responses are stored independently of mutable entities. Logical time is persisted and never follows wall time.

This is a correctness benchmark, not a production scalability claim. Complete snapshots and retained retry/audit history grow with workload; benchmark workloads are small. Only one live process writes a DATA_DIR. Process-kill tests exercise application crashes, not hardware power loss. The interrupted-request check permits either a complete pre-commit or post-commit state; it does not prove every filesystem instruction boundary was reached.

## Submission

Read [SUBMISSION.md](SUBMISSION.md), then run `npm run check:submission`. It intentionally fails until the required container/model evidence is present. Organizer approval, private GitHub hosting, and collaborator access are separate manual requirements.
