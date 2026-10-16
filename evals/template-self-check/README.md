# Official-template self-check evidence

These are authoring/verification checks, **not model attempts**. The new wrapper has its own manifest and verifier fingerprints; historical authoring-source Docker reports remain separate.

| Run | Actual result |
|---|---|
| [Initial Windows local attempt](local-20261016/INVALID.md) | Invalid environment evidence: the adapter dropped Windows `SYSTEMROOT`, so networking failed. Original logs and zeros are retained and explicitly excluded from correctness/difficulty claims. |
| [Fixed trusted-local scratch check](local-20261016-fixed/summary.json) | Reference 100/100 twice with identical outcomes; incomplete starter 0/100. No model attempts. This does not certify container isolation. |
| Clean Linux/Docker export check | Not executed yet; the hosted workflow is prepared. Requires independent reference, starter, private-file/UID probe and full-suite mutant measurements. |

Each run preserves command/setup/verifier logs, the raw legacy score and normalized `reward.json`. `provenance.json` identifies the source commit, manifest, execution mode and scratch copies. The initial uncommitted development attempt also preserves its old manifest and adapter source. Never relabel these records as frontier-model output.

The [self-check controller](../../scripts/template-self-check.py) uses a fresh directory per run and refuses to overwrite prior evidence. It applies each mutant independently after an unmutated control and records actual full-suite losses against the originally declared check points. That comparison is a review aid, not proof that each mutation affects a uniquely isolated feature. The suite still has 18 mutants, exceeding the official count guidance.
