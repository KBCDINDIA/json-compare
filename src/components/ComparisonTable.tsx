import { useMemo, useState } from 'react';
import { Table2, Eye, EyeOff, Search } from 'lucide-react';
import type { TimelineResult } from '../lib/types';
import {
  buildComparisonData,
  getCellStatus,
  type CellStatus,
  type FlatRow,
} from '../lib/flatten';

function formatDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

const STATUS_STYLES: Record<CellStatus, string> = {
  same: 'bg-white',
  changed: 'bg-sev-chgBg',
  added: 'bg-sev-addBg',
  removed: 'bg-sev-remBg text-ink-muted line-through',
  'type-changed': 'bg-sev-typBg border-l-2 border-sev-typFg',
  absent: 'bg-gray-50 text-ink-muted/40',
};

const STATUS_LEGEND: { status: CellStatus; label: string; bg: string }[] = [
  { status: 'same', label: 'Unchanged', bg: 'bg-white border border-edge' },
  { status: 'changed', label: 'Value Changed', bg: 'bg-sev-chgBg' },
  { status: 'added', label: 'Newly Added', bg: 'bg-sev-addBg' },
  { status: 'removed', label: 'Removed', bg: 'bg-sev-remBg' },
  { status: 'type-changed', label: 'Type Changed', bg: 'bg-sev-typBg' },
];

export function ComparisonTable({ result }: { result: TimelineResult }) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const data = useMemo(
    () => buildComparisonData(result.sorted),
    [result.sorted],
  );

  const rows = useMemo(() => {
    let base = showAll ? data.rows : data.changedRows;
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter((r) =>
        r.humanLabel.toLowerCase().includes(q) ||
        r.values.some((v) => v?.toLowerCase().includes(q)),
      );
    }
    return base;
  }, [data, showAll, query]);

  if (data.headers.length < 2) return null;

  return (
    <div className="bg-surface border border-edge rounded-xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3 bg-primary-soft/40 border-b border-edge">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Table2 size={18} className="text-primary" />
            <span className="font-semibold text-ink">
              Side-by-Side Comparison Table
            </span>
            <span className="text-xs text-ink-muted">
              {data.changedRows.length} of {data.rows.length} fields differ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-edge bg-white hover:bg-primary-soft text-ink-muted transition"
            >
              {showAll ? <EyeOff size={12} /> : <Eye size={12} />}
              {showAll ? 'Changed only' : 'Show all fields'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {STATUS_LEGEND.map((l) => (
            <div key={l.status} className="flex items-center gap-1.5 text-xs">
              <span className={`w-4 h-3 rounded-sm ${l.bg}`} />
              <span className="text-ink-muted">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-edge rounded-md px-2 py-1 mt-2">
          <Search size={14} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields or values…"
            className="flex-1 bg-transparent outline-none text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-accent-soft/60">
              <th className="sticky left-0 z-10 bg-accent-soft text-left px-4 py-3 border-b border-r border-edge font-semibold text-ink min-w-[220px]">
                Field
              </th>
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 border-b border-r border-edge min-w-[160px]"
                >
                  <div className="font-semibold text-ink">{h.title}</div>
                  {h.date && (
                    <div className="text-xs font-normal text-ink-muted">
                      {formatDate(h.date)}
                    </div>
                  )}
                  {h.remarks && (
                    <div className="text-xs font-normal text-ink-muted truncate max-w-[200px]">
                      {h.remarks}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={data.headers.length + 1}
                  className="px-4 py-6 text-center text-ink-muted"
                >
                  {showAll
                    ? 'No fields found.'
                    : 'No differences — all field values match across versions.'}
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <TableRow
                  key={ri}
                  row={row}
                  colCount={data.headers.length}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 bg-white border-t border-edge text-xs text-ink-muted">
        Showing {rows.length} of {data.rows.length} fields
        {!showAll && ` (${data.rows.length - data.changedRows.length} unchanged fields hidden)`}
      </div>
    </div>
  );
}

function TableRow({
  row,
  colCount,
}: {
  row: FlatRow;
  colCount: number;
}) {
  return (
    <tr className="hover:bg-primary-soft/20 transition-colors">
      <td
        className="sticky left-0 z-10 bg-surface px-4 py-2 border-b border-r border-edge text-xs font-medium text-ink"
        style={{ paddingLeft: `${16 + row.indent * 12}px` }}
      >
        {row.humanLabel}
      </td>
      {Array.from({ length: colCount }, (_, ci) => {
        const status = getCellStatus(row, ci);
        const val = row.values[ci];
        return (
          <td
            key={ci}
            className={`px-3 py-2 border-b border-r border-edge text-xs mono ${STATUS_STYLES[status]}`}
          >
            {val === null ? (
              <span className="text-ink-muted/40 italic">—</span>
            ) : (
              <span className="break-all">{val}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
