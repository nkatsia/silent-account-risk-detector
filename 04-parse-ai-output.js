/**
 * n8n Code node: "Parse AI Output"
 *
 * The AI Risk Analysis node's output replaces each item's json with
 * just its own completion, so account_id / account_name / arr would
 * otherwise be lost after this step. This re-attaches them from the
 * pre-AI item by index ($('Filter: Renewal within 120 days').all()),
 * parses the model's JSON response, and falls back to a safe
 * 'Unknown / Review manually' result if the model ever returns
 * something that doesn't parse — see debugging-notes.md, bug #3.
 */

const items = $input.all();
const sourceItems = $('Filter: Renewal within 120 days').all();

return items.map((item, index) => {
  let parsed;
  try {
    const rawText = item.json.output[0].content[0].text;
    parsed = JSON.parse(rawText);
  } catch (e) {
    parsed = { risk_tier: 'Unknown', reason: 'Parse error', action: 'Review manually' };
  }

  const sourceData = sourceItems[index] ? sourceItems[index].json : {};

  return {
    json: {
      account_id: sourceData.account_id,
      account_name: sourceData.account_name,
      arr: sourceData.arr,
      risk_tier: parsed.risk_tier,
      reason: parsed.reason,
      action: parsed.action
    }
  };
});
