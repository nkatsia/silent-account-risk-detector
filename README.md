# Silent Account Risk Detector

An n8n workflow that reads across four data sources every day, such as account health, renewal dates, stakeholder contacts and interaction history, and asks an AI model to synthesize a single risk signal per account: a tier, a plain-English reason and a specific recommended action. High-risk accounts get posted to Slack automatically.

Built to catch the churn signal that shows up weeks before a customer ever says something's wrong: usage quietly declining, a champion who's gone quiet, tickets piling up unresolved, while a renewal-date-only tracker or a static health score stays green.

📄 Full write-up with the "why" behind the design: **[Case study →](#)**

## How it works

1. **Read.** Pull four Google Sheets tabs daily: Accounts_Master, Renewals_Master, Contacts_Master, Interactions_Log.
2. **Aggregate.** Contacts and interactions are logged one row per event, so a single account can have several rows in each. Both get collapsed to one row per account before anything else touches them — see [`code/01-aggregate-contacts-by-account.js`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/01-aggregate-contacts-by-account.js) and [`code/02-aggregate-interactions-by-account.js`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/02-aggregate-interactions-by-account.js).
3. **Merge.** Join all four sources into a single record per account, matched on `account_id`.
4. **Pre-filter.** Drop any account with no renewal in the next 120 days — see [`code/03-filter-renewal-within-120-days.js`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/03-filter-renewal-within-120-days.js). Keeps the AI step focused and the token cost down.
5. **AI reasoning.** Each remaining account, including its raw, unlabeled interaction notes, goes to an LLM with a structured prompt asking for a risk tier, a plain-English reason grounded in specific details from the notes and one concrete action for the week.
6. **Parse.** Re-attach the account's identifying fields (lost after the AI call) and safely parse the model's JSON — see [`code/04-parse-ai-output.js`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/04-parse-ai-output.js).
7. **Write back.** Update `Risk_Tier`, `Risk_Reason`, and `Recommended_Action` columns in Accounts_Master.
8. **Alert.** If risk tier is High, post to Slack with account name, ARR, reason and recommended action.

## Repo structure

```
├── workflow/
│   └── silent-account-risk-detector.json   ← import this directly into n8n
├── code/
│   └── 01–04 …                             ← every Code node's JS, commented, in pipeline order
├── docs/
│   └── debugging-notes.md                  ← three real bugs found and fixed
└── README.md
```

## Running it yourself

1. Import [`workflow/silent-account-risk-detector.json`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/silent-account-risk-detector.json) into your own n8n instance (**Workflows → Import from File**).
2. Connect your own Google Sheets, Slack, and OpenAI credentials to the corresponding nodes. The JSON ships with placeholder credential references, not real ones.
3. Point the four Read nodes and the Write Back node at your own spreadsheet and the Slack node at your own channel.
4. Your spreadsheet needs four tabs (Accounts_Master, Renewals_Master, Contacts_Master, Interactions_Log) with the columns referenced in the code files (`account_id` as the join key across all four).

## Why this exists

Part of my Customer Success portfolio — see [`docs/debugging-notes.md`](https://github.com/nkatsia/silent-account-risk-detector/blob/main/debugging-notes.md) for three real correctness bugs I found and fixed after the first version looked like it was working.

## Tech stack

n8n · Google Sheets API · OpenAI API · Slack API

## License

MIT — see [LICENSE](https://github.com/nkatsia/silent-account-risk-detector/blob/main/LICENSE).
