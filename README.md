# Stockroom

**A real-world software engineering RL gym for coding agents.** Durable inventory, concurrent workflows and verifiable outcomes.

![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-43853d?style=flat-square)
![Zero runtime dependencies](https://img.shields.io/badge/runtime_dependencies-0-2563eb?style=flat-square)
![Recorded reference checks 56/56](https://img.shields.io/badge/reference_checks-56%2F56-15803d?style=flat-square)
![Recorded mutants detected 18/18](https://img.shields.io/badge/mutants_detected-18%2F18-7c3aed?style=flat-square)

Agents implement atomic reservations, partial fulfillment, cumulative returns, warehouse transfers, revision conflicts, logical expiry, durable retries and crash recovery. The public contract leaves internal architecture open. There is no UI.

## Official submission format

The [greenfield task](greenfield/README.md) follows the newly announced [ProblemSetters starter](https://github.com/ProblemSetters/earn-rl-gym-starter-template), pinned to commit `381889b`. It contains task metadata, public scaffold/config, sandbox images, reference solution, private verifier, mutant patches and proof directories.

The original authoring source stays authoritative. Regenerate the submission snapshot with `npm run export:template`; `npm run check:template` and the build detect drift. Only `greenfield/app/` and `greenfield/instruction.md` are candidate-visible. See [format decisions and unresolved guidance](docs/template-compatibility.md).

## Evidence status

| Evidence | Actual status |
|---|---|
| Authoring reference | 56/56 local and Linux Docker checks passed |
| Original mutation suite | 18/18 detected; targeted mutation reports |
| Original determinism | Three complete Docker runs with identical outcomes |
| Official-template adapter/environment | See [separate self-check evidence](evals/template-self-check/README.md) |
| OpenHands setup | Offline image/SDK setup passed; real provider execution untested |
| Real frontier-model evaluations | Zero attempts; funded provider access unavailable; difficulty unproven |

Badges summarize recorded results, not live CI or acceptance. The new adapter has separate fingerprints and validation; old Docker reports do not certify it. [Submission checklist](SUBMISSION.md) records every missing requirement. The starter README and AGENTS disagree on reasoning/thresholds; retain the stricter medium / below-30% protocol pending clarification.

## Development

Requires Node.js 24+, Git and npm. The runtime uses only the Node standard library; ESLint is the sole direct development dependency.

```sh
git clone https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents.git
cd RL-Gym-for-Coding-Agents
npm ci
npm run lint
npm run build
npm start
```

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. The service defaults to `127.0.0.1:3000`; `HOST`, `PORT` and `DATA_DIR` configure it. Read the [API contract](task/instruction.md) and [operations/evaluation guide](docs/evaluation.md) for exact behavior and all scripts. The build produces `dist/reference`, not a browser bundle.

Use `node --test scripts/template.test.mjs` and Python 3.11+ with `scripts/test_template_reward.py` for export/adapter regressions. The [template self-check workflow](.github/workflows/template-validation.yml) validates fresh Linux containers without provider credentials. Real model execution still needs Docker, provider access and confirmed current model IDs.

## Deployment and handoff

The reference requires persistent `DATA_DIR` storage and one writer per directory. No deployment or Vercel configuration is included; a Vercel deployment would require a durable-storage/concurrency design appropriate to this contract. See [reference limits](docs/evaluation.md#reference-design-and-limits).

- [Official greenfield task guide](greenfield/README.md)
- [Recorded evidence](evaluation/proof-of-work/README.md) and [template self-check](evals/template-self-check/README.md)
- [Authoring/self-check instructions](AGENTS.md)
- [Progress](PROGRESS.md), [production polish record](docs/production-polish.md) and [submission readiness](SUBMISSION.md)
