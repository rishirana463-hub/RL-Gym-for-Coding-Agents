# Evaluation status

| Requested step | Actual status |
|---|---|
| 1. Clean Docker validation | **Done:** reference 56/56, mutants 18/18, three stable complete runs. [Full evidence](docker/README.md). |
| 2. Two real OpenHands attempts | **Pending at the user's explicit request:** zero attempts, no model identities selected, no model scores. [Offline setup passed](openhands-preflight/README.md). |
| 3. Difficulty gate | **Not assessed:** requires two real complete Docker scores. |
| 4. Per-model failure analysis | **Not available:** requires actual source, trajectory logs and failed checks. |
| 5. Listing checklist and organizer draft | See [SUBMISSION.md](../SUBMISSION.md). |

The organizer [confirmed that API credits are not provided](https://discord.com/channels/1544210398180282380/1558107634698166384/1558380743925829733). The user chose to leave real evaluations pending on 2026-10-11. The listing's medium reasoning requirement conflicts with the organizer's higher reasoning guidance; eligibility and the applicable setting need confirmation. [Investigation details](../docs/model-access.md).

When access is available, use the existing [local commands or manual hosted workflow](../docs/evaluation.md#one-pass-openhands-evaluation). The hosted workflow is prepared, but real provider execution has not been tested. It saves full logs, run metadata, scores and source snapshots in `evals/<model-slug>-<identity-hash>/`, alongside the listing-required canonical proof directory. Write `ANALYSIS.md` there from actual evidence and preserve its equivalent as canonical `failure-analysis.md`.

No placeholder model folders, invented trajectories, numeric substitute scores or fabricated analyses have been created. The starter baseline and offline setup are not model results.
