import { useEffect, useRef, useState } from 'react';

function SpecRow({ label, value }) {
  const [expanded, setExpanded] = useState(false);
  const [truncatable, setTruncatable] = useState(false);
  const valueRef = useRef(null);

  useEffect(() => {
    const el = valueRef.current;
    if (el) setTruncatable(el.scrollHeight > el.clientHeight + 1);
  }, [value]);

  return (
    <div className="flex items-start gap-4 py-2.5">
      <dt className="w-2/5 shrink-0 text-slate-500" dangerouslySetInnerHTML={{ __html: label }} />
      <div className="min-w-0 flex-1">
        <dd
          ref={valueRef}
          className={`font-medium text-slate-900 ${expanded ? '' : 'line-clamp-2'}`}
          dangerouslySetInnerHTML={{ __html: value }}
        />
        {truncatable && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {expanded ? 'View less' : 'View more'}
          </button>
        )}
      </div>
    </div>
  );
}

// Renders a legacy pasted-<table> description as a plain key/value list —
// no grid lines, label and value side by side, long values clamped to two
// lines with a per-row expand toggle. See extractSpecTables() in lib/richText.js.
export default function SpecTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-200">
      {rows.map((row, i) => (
        <SpecRow key={i} label={row.label} value={row.value} />
      ))}
    </dl>
  );
}
