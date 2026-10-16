# Stockroom authoring and self-check

Follow current user instructions first. Read `PROGRESS.md` before starting and never repeat Done work without a regression or a requested change. Commit progress with each phase, after running lint/build and appropriate verification.

## Source and submission boundaries

- Authoritative source remains `task/`, `reference/`, `evaluation/`, `environment/` and `app-setup/`.
- `greenfield/` is the deterministic official-template submission snapshot. Edit authoring source or `scripts/template-files/`, run `npm run export:template`, then `npm run check:template`. Do not hand-edit generated source. Actual evidence below its proof/verifications directories is preserved separately.
- `greenfield/template-manifest.json` fingerprints the exported source and records official starter commit `381889b5139b0c5f78da0ddcfa3f053719210c4b`. The build rejects stale exports.
- Only `greenfield/app/` and `greenfield/instruction.md` are model-visible. Keep references, verifiers, patches, metadata and proof private. Never mount a Docker socket or provider keys into the candidate workspace.
- The reference is an API-only Node standard-library project. Preserve the stack and contract; do not add a UI, React, external database or new dependencies for template compatibility.

## Verification

Use the pinned [official authoring/self-check guidance](docs/official-template-AGENTS.md) and [compatibility decisions](docs/template-compatibility.md). Its scratch-copy/no-edit rule applies to validation, not authorized source changes.

1. Read the instruction, task metadata and scoring. Generate acceptance scenarios independently of implementation details.
2. Check `npm run lint`, `npm run build`, `node --test scripts/template.test.mjs` and `python scripts/test_template_reward.py` with the available Python 3.11+ interpreter.
3. Run `scripts/template-self-check.py --docker --out <fresh-directory>` on Linux/Docker, or use `.github/workflows/template-validation.yml`. It copies the task and every candidate into fresh scratch directories, grades the reference twice, the starter, an isolation probe, an unmutated control and every independent patch. Preserve complete outputs, including failures.
4. Use the root-only verifier image with the private mount below `/opt/private/task`; candidates run as UID/GID 10001. Trusted local checks require an explicit bypass and cannot certify sandbox isolation. Infrastructure failures must have null scores.
5. Review every missed self-check item and record evidence honestly. Eighteen preserved mutants exceed the starter's count guidance; targeted legacy mutant checks do not prove full-suite score loss.

The starter README prefers high reasoning / ideally below 50%, while its AGENTS requires medium / below 30% and describes a distinct high-reasoning final assessment. Preserve the existing medium / strictly-below-30% protocol until the organizer clarifies. Confirm latest qualifying model versions using official publisher sources at generation time. Never infer eligibility from a model name alone.

No real model attempts have occurred; funded provider access, organizer approval and collaborator access remain unavailable/unverified. Do not fabricate trajectories, count template synthetic examples, relabel setup failure as difficulty, or overwrite an attempt. The organizer message remains an unsent draft unless the user explicitly authorizes sending it.
