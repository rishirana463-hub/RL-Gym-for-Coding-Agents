# RL Gym Task Self-Check: Stockroom

Reviewed 2026-10-16 using the pinned [official AGENTS](official-template-AGENTS.md); independent documentation review completed 2026-10-17. Actual execution: [run 38926363562](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38926363562), source `8721c8d`, fresh Ubuntu runner and independent scratch task/workspaces. [Complete evidence](../evals/template-self-check/README.md), [verified download](../evals/template-self-check/38926363562/download.json), [current task manifest](../greenfield/template-manifest.json). No candidate-authoring source was edited during the self-check.

## Instruction

- Realistic: **Looks good.** Warehouse receipts, reservations, fulfillment, returns, transfers, optimistic revisions and durable retries are practical stateful workflows. Scope approval is still an organizer decision.
- No verifier/test leakage: **This check is not passing yet under the literal guidance.** No hidden test names, IDs or weights appear in the instruction, but its final line names the public `smoke.mjs` check. The pinned guidance prohibits naming test files without an explicit public-test exception. This is a wording/compliance gap, not evidence that the private suite was exposed. The tested instruction and package remain unchanged.
- No evaluation framing: **Looks good.** The instruction describes an application contract rather than RL training or model assessment.

## Verifier

- Deterministic: **Looks good.** Two independent scratch references scored exactly 100/100 with identical check outcomes. An additional unmutated control scored 100. All 56 checks executed each time.
- Genuine black-box verification: **Looks good.** Checks use HTTP and process restart behavior. Response shapes, runtime entry point and ready event are stated in the instruction; persistence architecture is open. Candidate processes run as UID/GID 10001. A separate probe passed all checks while asserting this UID and denied access to the private scoring file.
- Partial credit: **Looks good.** Eight groups each contribute their passing fraction of 12.5 points; an individual failure does not zero a major component. The 0–100 adapter agrees with the original weighted 0–1 result.
- Functionality weights: **Looks good at the declared group level.** Each group is 12.5%, below 25%, with six or eight granular checks.
- Sub-check weights: **Looks good.** All 56 check weights sum to 100 points; the maximum is 2.0833333333333335%, below 5%.
- Non-functional share: **Not shown yet under an agreed classification.** Recovery alone contributes 12.5%; classifying concurrency as robustness too gives 25%, above 20%. Transport validation and durable retry semantics also need an explicit functional/non-functional mapping. The report does not choose a classification merely to claim compliance; weights were unchanged.

## Mutants

- Count and mix: **This check is not passing yet.** There are 18 original mutations, exceeding 7–8 core plus 1–2 non-functional. Recovery mutations exist, but the full mix needs an agreed classification. Coverage was preserved rather than silently dropping variants.
- Score loss matches declared target points within two percentage points: **This check is not passing yet for 12 mutants.** All were graded against the entire suite, using separate fresh reference copies and independent patches. The comparison below uses the weights of the original declared target check IDs, not a newly inferred feature weight. Composite workflow failures make some losses broader; feature isolation/weight mapping needs review.
- Caught on behavior after a perfect control: **Looks good.** All 18 patches applied independently, passed setup/syntax checks and scored below 100. No mutation was counted solely for a build failure. Full scores and assertion details are saved under `greenfield/verifier/mutants/verifications/`.

| Mutant | Measured full score / 100 | Declared target points | Actual loss | Within 2 points |
|---|---:|---:|---:|---|
| M01 | 84.375000 | 3.645833 | 15.625000 | **No** |
| M02 | 98.437500 | 1.562500 | 1.562500 | Yes |
| M03 | 96.875000 | 1.562500 | 3.125000 | Yes |
| M04 | 91.666667 | 4.166667 | 8.333333 | **No** |
| M05 | 90.625000 | 5.729167 | 9.375000 | **No** |
| M06 | 98.437500 | 1.562500 | 1.562500 | Yes |
| M07 | 97.916667 | 2.083333 | 2.083333 | Yes |
| M08 | 86.458333 | 4.166667 | 13.541667 | **No** |
| M09 | 93.229167 | 1.562500 | 6.770833 | **No** |
| M10 | 94.791667 | 1.562500 | 5.208333 | **No** |
| M11 | 90.104167 | 4.687500 | 9.895833 | **No** |
| M12 | 95.833333 | 2.083333 | 4.166667 | **No** |
| M13 | 94.270833 | 3.645833 | 5.729167 | **No** |
| M14 | 85.416667 | 4.166667 | 14.583333 | **No** |
| M15 | 94.791667 | 1.562500 | 5.208333 | **No** |
| M16 | 97.916667 | 2.083333 | 2.083333 | Yes |
| M17 | 93.229167 | 5.208333 | 6.770833 | Yes |
| M18 | 93.750000 | 4.166667 | 6.250000 | **No** |

## Reference solution

- Exists and runs: **Looks good.** Setup completed in the task image and the unchanged reference ran in the isolated verifier environment.
- Scores 1.0: **Looks good.** Reference runs 1 and 2 and the independent control each scored 100/100 (equivalent to 1.0). The incomplete app scaffold scored 0/100; this is not a model result.
- Not hacky: **Looks good from source review and behavior checks.** The reference implements state transitions and durable transactions without detecting verifier inputs. This review and the passing checks do not prove complete production correctness or hardware power-loss safety.

## Proof-of-work

- Two qualifying completed model runs: **This is not shown yet.** Zero model attempts, no selected identities, no funded provider access configured. Neither scores nor provider integration can be certified.
- Each qualifying model below 30% at medium reasoning on the final version: **This is not shown yet.** No model scores exist. The template README's high/below-50% preference conflicts with AGENTS' medium/below-30% candidate protocol; keep the stricter existing protocol until clarified. The described high/below-40% final assessment is distinct.
- Repeated zero model scores reviewed: **Not applicable yet.** No qualifying models have run. The initial Windows reference zeros were reviewed as an adapter environment bug, preserved as invalid evidence and fixed; they are not model difficulty evidence.
- Latest instruction/verifier: **Not shown for model runs.** The measured reference/mutant records match the current exported manifest byte-for-byte, and all mutated source fingerprints were independently verified. Future model generation must record current instruction/verifier versions and qualifying publisher/release chronology. No synthetic template examples were imported.

## Items to review

1. Agree on functional/non-functional classification and verify that the non-functional share is at most 20%.
2. Resolve the 18-mutant count/mix difference against the official 7–8 core plus 1–2 non-functional guidance.
3. Review feature isolation and target-point mapping for M01, M04, M05, M08, M09, M10, M11, M12, M13, M14, M15 and M18; their measured losses exceed declared check points by more than two points.
4. Obtain two real latest-qualifying frontier-model attempts with actual source, trajectories, metadata, scores and analyses in the official model-named proof format. Provider access remains unavailable. The authoring generation workflow's end-to-end new-format model handoff has not been exercised.
5. Clarify the conflicting reasoning/difficulty protocols and verify current model eligibility at generation time. Other or free-tier runs could inform early review but would not establish the official final-assessment result.
6. Organizer task-idea approval and collaborator access remain outstanding. Confirm the external organizer runner honors the private mount/verifier-image contract; only this repository's runner was exercised.
7. The instruction names a public test file. The literal instruction criterion requires no test filenames; any intended public-test exception has not been confirmed.

The initial legacy CI clean-checkout guard failure was caused by a historical mixed-line-ending log affected by the new LF rule. Its bytes were preserved; a fresh-checkout reproduction and [follow-up validation 38927309305](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38927309305) confirmed the fix. Final legacy validation [38930130107](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38930130107) also succeeded on source `032d100`, including reference, mutant and three-run determinism steps; its [status record](../evals/docker/follow-up-38930130107.json) does not replace the preserved raw evidence. No failed guard artifact was used as fresh task evidence. Repository private visibility was restored and independently verified again on 2026-10-17; uninterrupted historical privacy is not claimed.

**This is a basic pre-submission validation, not the final review. The final review may identify additional issues.**

**Please resolve the feedback above before you submit the task.**
