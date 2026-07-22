# Debugging notes

This workflow ran cleanly from the first version with no errors and a Slack alert every morning. However, three issues still needed fixing before the output was actually trustworthy.

## Bug 1: the same account was getting scored twice

**Symptom:** a handful of accounts appeared to be evaluated more than once per run, occasionally with slightly different risk tiers between the two.

**Cause:** Contacts_Master logs one row per stakeholder, so an account with three contacts has three rows sharing the same `account_id`. Merged in directly, that meant the account itself was duplicated before it ever reached the AI step, each contact row produced its own full account record.

**Fix:** added an aggregation step (`Aggregate Contacts by Account`) that collapses every contact row for an account into a single `contacts_summary` string before the merge, so each account reaches scoring exactly once regardless of how many stakeholders it has.

## Bug 2: cleaning up the write-back broke the Slack message

**Symptom:** after removing a couple of unused columns from the Google Sheets write-back step (tidying up the sheet), the Slack alert started posting with missing account name and ARR.

**Cause:** the write-back node's output was also what the Slack step downstream was reading from. Trimming "unused" columns out of the write-back mapping didn't just clean up the sheet, it also removed those fields from what got passed to the next node, since nothing downstream was explicitly asking for them.

**Fix:** explicitly mapped `account_name` and `arr` back into the write-back node's output columns, so trimming the sheet and losing data for later steps are no longer the same action.

## Bug 3: the AI step was silently falling back to "Unknown"

**Symptom:** an occasional account came through with `risk_tier: "Unknown"` and `reason: "Parse error"` — the fallback values — despite the AI clearly having something useful to say.

**Cause:** the parsing code was reading the model's response from a path that didn't match what the AI node actually returns, so a working response was being treated as unparseable and silently swallowed into the fallback instead of throwing something visible.

**Fix:** corrected the parsing code to match the AI node's real output shape and kept the fallback in place as a genuine safety net — it should only fire when the model returns something truly malformed, not on every response.

## Takeaway

None of these three bugs threw an error and that's what made them dangerous. A workflow that "runs successfully" and a workflow that's *right* are different claims, and the second one only gets checked by actually reading the output against what you know about the accounts, not by watching the execution log turn green.
