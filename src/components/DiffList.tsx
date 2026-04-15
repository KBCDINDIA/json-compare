import { useMemo, useState } from 'react';
import type { DiffResult, DiffEntry, DiffGroup } from '../lib/types';
import { SeverityBadge } from './SeverityBadge';
import { formatValue } from '../lib/humanize';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export function DiffList({ result }: { result: DiffResult }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return result.groups;
    const q = query.toLowerCase();
    return result.groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter(
          (e) =>
            e.sentence.toLowerCase().includes(q) ||
            e.humanPath.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.entries.length > 0);
  }, [result.groups, query]);

  if (result.entries.length === 0) {
    return (
      <div className="bg-surface border border-edge rounded-xl p-8 text-center">
        <div className="text-2xl mb-2">✨</div>
        <div className="font-semibold text-ink">No differences found</div>
        <div className="text-sm text-ink-muted mt-1">
          Both JSON documents match{' '}
          {result.counts.total === 0 ? 'exactly' : 'after filtering'}.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {result.topFindings.length > 0 && (
        <div className="bg-accent-soft border border-accent rounded-xl p-4">
          <div className="font-semibold text-ink mb-2 text-sm">
            ★ Top findings
          </div>
          <ul className="space-y-1 text-sm">
            {result.topFindings.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5">
                  <SeverityBadge severity={e.severity} />
                </span>
                <span className="text-ink">
                  <span className="text-ink-muted">{e.humanPath}: </span>
                  {e.sentence}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 bg-surface border border-edge rounded-lg px-3 py-2">
        <Search size={16} className="text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search changes…"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      {filtered.map((g, i) => (
        <Group key={i} group={g} />
      ))}
    </div>
  );
}

function Group({ group }: { group: DiffGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-surface border border-edge rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary-soft/40 hover:bg-primary-soft transition"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium text-ink">📂 {group.parentPath}</span>
        </div>
        <span className="text-xs text-ink-muted">
          {group.entries.length} change
          {group.entries.length === 1 ? '' : 's'}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-edge">
          {group.entries.map((e, i) => (
            <EntryRow key={i} entry={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: DiffEntry }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <SeverityBadge severity={entry.severity} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink">{entry.sentence}</div>
          {(entry.severity === 'changed' || entry.severity === 'typeChanged') && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-sev-remBg/50 rounded px-2 py-1">
                <div className="text-ink-muted mb-0.5">Before</div>
                <div className="mono text-ink break-all">
                  {formatValue(entry.oldValue)}
                </div>
              </div>
              <div className="bg-sev-addBg/50 rounded px-2 py-1">
                <div className="text-ink-muted mb-0.5">After</div>
                <div className="mono text-ink break-all">
                  {formatValue(entry.newValue)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
