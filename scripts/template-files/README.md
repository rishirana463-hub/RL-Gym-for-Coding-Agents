# Stockroom — greenfield task

This task follows [ProblemSetters' starter](https://github.com/ProblemSetters/earn-rl-gym-starter-template), pinned in `template-manifest.json`. It asks for a durable warehouse fulfillment API, with partial workflows, concurrency, retries and crash recovery. There is no UI.

| Path | Purpose | Candidate-visible |
|---|---|---|
| `instruction.md` | Observable application contract | Yes |
| `app/` | Incomplete scaffold and setup/run configuration | Yes |
| `task.toml`, `environment/` | Task limits and sandbox images | Runtime configuration only |
| `reference-solution/` | Complete reference implementation | No |
| `verifier/` | Behavioral checks, points and independent mutant patches | No |
| `proof-of-work/` | Actual run evidence | No |

This directory is a generated submission snapshot. Edit the parent repository's authoring source, then run `npm run export:template`; use `npm run check:template` to detect drift. It can also be copied as a standalone task. No dependency directories, build outputs, databases or credentials are included.

## Setup and run

Use Node.js 24+. The sandbox also provides Python 3.11+ for the verifier. In a workspace copied from `app/` or `reference-solution/`, use the commands in `app/config.toml`: `node --check server.mjs`, then `node server.mjs`. The shared config applies to the reference too. The service defaults to port 3000; verification selects fresh ephemeral ports and state directories.

## Verification

The verifier accepts absolute `WORKSPACE`, `TASK_DIR` and `OUT_DIR`. It writes `reward.json` (0–100), `legacy-score.json` (the original 0–1 score), and full `verifier.log`. Relative credit is unchanged; each check contributes its group's weight divided by that group's check count. Infrastructure failure produces a null score and a nonzero exit, never a synthetic zero.

For untrusted code, build `environment/verifier.Dockerfile` and use a fresh container. Mount the task read-only at `/opt/private/task`, the candidate read-only at `/work/candidate`, and a fresh writable output directory at `/logs/verifier`. The root-only `/opt/private` parent hides reference/verifier/proof assets from candidate processes running at UID/GID 10001. The verifier requires this boundary; it does not expose a Docker socket.

```sh
docker build -f environment/verifier.Dockerfile -t stockroom-template-verifier environment
docker run --rm --network none --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add KILL --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges --memory 1g --cpus 2 --pids-limit 256 \
  --mount type=bind,source="$PWD",target=/opt/private/task,readonly \
  --mount type=bind,source=/absolute/prepared-workspace,target=/work/candidate,readonly \
  --mount type=bind,source=/absolute/fresh-results,target=/logs/verifier \
  -e TASK_DIR=/opt/private/task -e WORKSPACE=/work/candidate -e OUT_DIR=/logs/verifier \
  stockroom-template-verifier python3 verifier/tests/run_tests.py
```

For trusted local scratch checks only, set `STOCKROOM_TRUSTED_LOCAL=1` and run `python3 verifier/tests/run_tests.py` with absolute paths. This bypasses container isolation and is not appropriate for model-generated code. The verifier refuses to overwrite existing results.

## Evidence and remaining requirements

See `proof-of-work/README.md` and `verifier/mutants/README.md`. Original authoring-source Docker reference 56/56, mutant detection 18/18 and three stable runs are historical evidence; the new wrapper/image must be verified independently. Actual exported-wrapper runs are distinguished by their manifest hash and execution mode.

No real model attempts have occurred. Two current qualifying frontier model runs, full trajectories, generated source, verification records and failure analyses remain required. Record them as `proof-of-work/<model>-<reasoning>-<timestamp>/`, omitting the provider prefix, with `solution/`, `metadata.json`, `trajectory.jsonl` and `verifications/1/reward.json`. Keep original raw logs and hashes. Do not copy the starter template's synthetic examples or substitute setup failures for model scores.

The starter README prefers high reasoning / ideally below 50%; its AGENTS.md requires medium / below 30%. Keep the stricter existing medium / below-30% gate pending organizer clarification. Access, task-idea approval and collaborator access remain outstanding.
