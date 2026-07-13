/**
 * n8n Code node: "Aggregate Contacts by Account"
 *
 * Contacts_Master has one row per contact, so an account with three
 * stakeholders produces three rows with the same account_id. Left
 * un-aggregated, that duplicates the account downstream and causes it
 * to be scored (and potentially alerted on) multiple times in the same
 * run. This collapses all contacts for an account into a single
 * contacts_summary string before the merge — see debugging-notes.md,
 * bug #1.
 */

const items = $input.all();
const grouped = {};
for (const item of items) {
  const id = item.json.account_id;
  if (!grouped[id]) {
    grouped[id] = { account_id: id, contacts_combined: [] };
  }
  grouped[id].contacts_combined.push(`${item.json.contact_name} (${item.json.job_title}, ${item.json.seniority}) - last contacted ${item.json.last_contacted_date}`);
}
return Object.values(grouped).map(g => ({
  json: {
    account_id: g.account_id,
    contacts_summary: g.contacts_combined.join(' | ')
  }
}));
