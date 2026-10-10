# Handoff checklist

## Already implemented locally

- Model-facing behavior contract, public starter, and smoke check.
- Complete reference service with durable retries and state transitions.
- 56 private black-box checks, eight score components totaling 1.0.
- 18 realistic executable code mutants and recorded detection results.
- Build, start, and safe reset scripts; application and OpenHands Dockerfiles.
- Fresh-workspace, single-pass OpenHands runner with medium reasoning.
- Evidence recording, source fingerprints, repeated-run verification, and readiness gate.

## Still required before submitting

1. Obtain organizer approval of the task idea, as requested in the original listing. The user's instruction to build authorized local implementation; it does not establish organizer approval.
2. Run the container reference, mutation, and determinism commands in README. Review any Linux-specific failures before proceeding.
3. Choose two eligible frontier models and configure their provider access locally. Execute each once using the same recorded limits and medium reasoning. Preserve logs and generated code. No model runs have been performed yet.
4. Score each saved solution in containers. Both scores must be **strictly below 0.30**. Do not count setup/API failures as task difficulty evidence.
5. Write a short failure analysis for each actual run, linked to failing check IDs and components.
6. Create one **private** GitHub repository and upload this project and required evidence. Keep secrets, runtime state, and `.runs` out of Git; include the automatically saved model source snapshots under their proof directories.
7. Ask the organizer for the GitHub account associated with `content.team@problemsetters.com`, or invite that email through GitHub if supported. Verify the invitation/access; do not assume an email is a GitHub username.
8. Run `npm run check:submission`, review the manual requirements, and submit the private repository link through the task page.

## Proposed idea to send for organizer review

Stockroom is a stateful warehouse inventory and order fulfillment service. Agents implement atomic multi-item reservations, partial shipments and cancellations, cumulative returns, dispatch/receipt reconciliation across warehouses, a controllable expiry clock, optimistic concurrency, durable idempotent retries, and recovery after process crashes. The task specifies an HTTP contract and exact observable behavior while leaving internal architecture open. Hidden black-box checks cover valid workflows, rejected transitions, concurrency, and recovery. The reference, verifier, mutation suite, and OpenHands evaluation evidence are delivered in the requested repository structure.
