# Model access investigation

Checked 2026-10-11 (Asia/Calcutta). No provider key values were read or recorded.

| Source | Finding |
|---|---|
| [Original bounty listing](bounty-listing.txt) supplied by the user | Requires two different frontier models, medium reasoning, one OpenHands attempt each. Does not state that API keys, credits or reimbursement are provided. |
| Public HackerRank search for this task, OpenHands and model credits | No authoritative task-specific provision found. This does not prove that private onboarding provides none. |
| Signed-in [HackerRank bounty application](https://www.hackerrank.com/earn/applications/603) | Read the complete live listing. It matches the supplied requirements and contains no API key, credit offer, model-access endpoint or eligible model list. It directs coordination/feedback to Discord. The application already displays **Submitted**, dated Oct 10, with this repository link; this inspection did not edit it. |
| Linked [HackerRank Experts Discord](https://discord.gg/tQf7gZB2FH) | Valid invitation; channel content requires Discord login. The user confirmed existing access and is signing in. Private onboarding has not yet been inspected. No account was created and no message was sent. |
| Local process configuration | No configured `LLM_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` at initial inspection. |
| Existing private GitHub repository | Actions enabled; zero repository Actions secrets at inspection. No eligible model IDs have been supplied. |

**Conclusion: the live HackerRank listing does not offer model access; organizer-provided access through Discord is still unconfirmed.** No real model attempt or provider charge has been initiated. Inspect private onboarding, or ask the organizer whether they provide credentials/credits, which exact models are eligible, and what limits apply. The [OpenHands SDK setup guide](https://docs.openhands.dev/sdk/getting-started) requires an authentication method; installing its SDK does not establish funded provider access.

If the organizer supplies access, configure it through a secure process environment or private Actions secrets. Do not paste keys into chat, commit `.env`, or save credentials in run logs. Eligibility and medium reasoning support must be confirmed before starting either one-pass attempt. The organizer message is a draft only; no message has been sent.
