# Model access investigation

Checked 2026-10-11 (Asia/Calcutta). No provider key values were read or recorded.

| Source | Finding |
|---|---|
| [Original bounty listing](bounty-listing.txt) supplied by the user | Requires two different frontier models, medium reasoning, one OpenHands attempt each. Does not state that API keys, credits or reimbursement are provided. |
| Public HackerRank search for this task, OpenHands and model credits | No authoritative task-specific provision found. This does not prove that private onboarding provides none. |
| Signed-in [HackerRank bounty application](https://www.hackerrank.com/earn/applications/603) | Read the complete live listing. It matches the supplied requirements and contains no API key, credit offer, model-access endpoint or eligible model list. It directs coordination/feedback to Discord. The application already displays **Submitted**, dated Oct 10, with this repository link; this inspection did not edit it. |
| Signed-in [HackerRank Experts Discord organizer reply](https://discord.com/channels/1544210398180282380/1558107634698166384/1558380743925829733) | Saurabh Maurya, Oct 10, 2026 at 12:58 PM (browser-displayed local time), explicitly says: “We won't be providing API credits.” He permits evaluations using two models the participant can access and asks for higher reasoning. Verified in the original thread after finding it in server search. |
| User's own task thread | Inspected `#603 - Rishi [In-progress]`; only the user's organizer mention was visible, with no idea approval or supplied credentials. No message was sent. |
| Local credential presence recheck after the user's resume request | No configured `LLM_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `MODEL_A_API_KEY` or `MODEL_B_API_KEY` in process, user or machine environment scopes. Only presence flags were reported. |
| Existing private GitHub repository | Actions enabled; a fresh metadata check found zero repository Actions secrets. No eligible model IDs have been supplied. |

**Conclusion: the organizer explicitly does not provide API credits; participants must use model access they already have.** No organizer-provided endpoint or credentials were found in the listing or inspected task discussion. No real model attempt or provider charge has been initiated. On 2026-10-11 the user initially requested leaving evaluations pending, then asked to resume. When asked about access, the user confirmed they have none and that reasoning guidance remains unconfirmed. Real execution is therefore requested but blocked, rather than voluntarily deferred.

The listing requires frontier models with **medium** reasoning, whereas the organizer reply says two accessible models with **higher** reasoning. Confirm which models and reasoning setting apply to this application before spending an attempt; the current harness retains the listing's medium setting. The [OpenHands SDK setup guide](https://docs.openhands.dev/sdk/getting-started) requires an authentication method; installation alone does not establish funded access.

Execution requires funded authorized provider access, exact model identities and confirmed reasoning guidance. Configure credentials through a secure process environment or private Actions secrets; do not paste keys into chat, commit `.env`, or save credentials in run logs. The [organizer draft](organizer-message.md) now asks whether an approved evaluator could perform the runs or an alternative is accepted. No such arrangement or waiver has been granted, and no message has been sent.
