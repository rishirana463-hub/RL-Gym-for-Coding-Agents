# Official-template self-check evidence

These are authoring/verification checks, **not model attempts**. The new wrapper has its own manifest and verifier fingerprints; historical authoring-source Docker reports remain separate.

| Run | Actual result |
|---|---|
| [Initial Windows local attempt](local-20261016/INVALID.md) | Invalid environment evidence: the adapter dropped Windows `SYSTEMROOT`, so networking failed. Original logs and zeros are retained and explicitly excluded from correctness/difficulty claims. |
| [Fixed trusted-local scratch check](local-20261016-fixed/summary.json) | Reference 100/100 twice with identical outcomes; incomplete starter 0/100. No model attempts. This does not certify container isolation. |
| [Clean Linux/Docker export check](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38926363562) | Passed on source `8721c8d`: reference 100/100 twice, starter 0/100, UID/private-file probe 100/100, control 100/100, all 18 full-suite mutants detected. Twelve mutants have broader losses than declared target-check points allow. [Summary](38926363562/summary.json). |

Each run preserves command/setup/verifier logs, the raw legacy score and normalized `reward.json`. `provenance.json` identifies the source commit, manifest, execution mode and scratch copies. The initial uncommitted development attempt also preserves its old manifest and adapter source. Never relabel these records as frontier-model output.

The [self-check controller](../../scripts/template-self-check.py) uses a fresh directory per run and refuses to overwrite prior evidence. It applies each mutant independently after an unmutated control and records actual full-suite losses against the originally declared check points. That comparison is a review aid, not proof that each mutation affects a uniquely isolated feature. The suite still has 18 mutants, exceeding the official count guidance.

Downloaded artifact `12056418972` matched GitHub's SHA-256 `394c72d80e76572b16a5b1f596d7a7828740d75a12c61365d860821f657a58b0`. Its manifest matches the current exported task byte-for-byte; reference/control and all 18 mutated-source fingerprints were independently verified. [Download provenance](38926363562/download.json). Complete 145-file measured output is preserved here. Required reference/starter/privacy and mutant records are also copied into the official `greenfield/proof-of-work/` and `greenfield/verifier/mutants/verifications/` locations.

The accompanying legacy validation initially stopped before task checks because an LF rule made a historical mixed-line-ending log appear dirty. An explicit byte-preservation exception fixed that clean-checkout regression; [follow-up run 38927309305](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38927309305) passed. No historical log was rewritten, and no failed guard run is counted as fresh correctness evidence.

Final legacy CI [38930130107](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38930130107) also passed on `032d100`; [status-only provenance](../docker/follow-up-38930130107.json) was saved on 2026-10-17. Independent documentation review additionally flagged the instruction's public test filename against the literal no-test-names criterion. This does not alter the measured scores or source manifest; the formal report and checklist now disclose it.

See the [complete official self-check report](../../docs/template-self-check.md) for passing checks, unresolved classifications, mutant loss differences and missing model proof. Successful technical execution does not mean every authoring requirement is satisfied.
