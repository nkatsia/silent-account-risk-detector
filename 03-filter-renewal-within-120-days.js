/**
 * n8n Code node: "Filter: Renewal within 120 days"
 *
 * Rule-based pre-filter that runs before any AI call. Accounts with no
 * renewal in the next 120 days are dropped here — keeps the AI step
 * focused on accounts where a risk signal is actually actionable, and
 * keeps the per-run token cost down.
 */

const items = $input.all();
const filtered = items.filter(item => {
  const daysToRenewal = item.json.days_to_renewal;
  return daysToRenewal !== undefined && daysToRenewal <= 120;
});
return filtered;
