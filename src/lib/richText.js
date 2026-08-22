// Quill's HTML export inserts literal &nbsp; between ordinary words (not just
// at format boundaries) to stop contenteditable from collapsing trailing
// spaces. A non-breaking space can never be a line-break point, so left as-is
// this breaks normal word wrapping — normalize back to a regular space.
export const normalizeQuillHtml = (html) =>
  html.replaceAll(/&nbsp;/gi, ' ').replaceAll('\xa0', ' ');

const TABLE_MARKER = /@@SPEC_TABLE_(\d+)@@/;

// Some legacy product descriptions have a raw <table> pasted into them
// (predating the Quill editor, which has no table tool). A bare <table>
// renders with unstyled borders and an unconstrained column, so instead of
// rendering it as a table we pull its rows out as label/value pairs and
// hand them to <SpecTable>, which renders them as a clamped key/value list.
// Already-sanitized `html` in, an array of alternating text/table-index
// segments out (even indices are HTML strings, odd indices are table
// indices into `tables`) — mirrors what String#split does with a
// capturing-group regex, so the caller can just .map over it.
export function extractSpecTables(html) {
  if (typeof window === 'undefined' || !html) return { segments: [html ?? ''], tables: [] };
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tables = [];
  doc.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.querySelectorAll('tr'))
      .map((tr) => {
        const cells = Array.from(tr.querySelectorAll('th, td'));
        return { label: cells[0]?.innerHTML.trim() ?? '', value: cells[1]?.innerHTML.trim() ?? '' };
      })
      .filter((row) => row.label || row.value);
    table.replaceWith(doc.createTextNode(`@@SPEC_TABLE_${tables.length}@@`));
    tables.push(rows);
  });
  return { segments: doc.body.innerHTML.split(TABLE_MARKER), tables };
}
