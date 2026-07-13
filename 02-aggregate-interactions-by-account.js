/**
 * n8n Code node: "Aggregate Interactions by Account"
 *
 * Same shape of problem as the contacts aggregation: Interactions_Log
 * has one row per interaction. This collapses them to one row per
 * account — taking the highest open_ticket_count seen (rather than
 * summing, since the same ticket count can be logged against multiple
 * interaction rows) and joining all notes into a single
 * interaction_history string, in order, for the AI step to read.
 */

const items = $input.all();
const grouped = {};
for (const item of items) {
  const id = item.json.account_id;
  if (!grouped[id]) {
    grouped[id] = { account_id: id, open_ticket_count: 0, notes_combined: [] };
  }
  grouped[id].open_ticket_count = Math.max(grouped[id].open_ticket_count, Number(item.json.open_ticket_count) || 0);
  grouped[id].notes_combined.push(`[${item.json.date}, ${item.json.type}] ${item.json.notes}`);
}
return Object.values(grouped).map(g => ({
  json: {
    account_id: g.account_id,
    open_ticket_count: g.open_ticket_count,
    interaction_history: g.notes_combined.join(' | ')
  }
}));
