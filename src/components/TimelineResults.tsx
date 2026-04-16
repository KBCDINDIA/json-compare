import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import type { TimelinePair, TimelineResult } from '../lib/types';
import { DiffList } from './DiffList';

function formatDate(d: string): string {
  if (!d) return 'no date';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

export function TimelineResults({ result }: { result: TimelineResult }) {
  return (
    <div className="space-y-6">
      <TimelineOverview result={result} />
      {result.pairs.map((p, i) => (
        <PairSection key={i} pair={p} index={i} defaultOpen={i === 0} />
      ))}
    </div>
  );
}

function TimelineOverview({ result }: { result: TimelineResult }) {
  return (
    <div className="bg-primary-soft/40 border border-primary/30 rounded-xl p-4">
      <div className="text-sm font-semibold text-ink mb-3">
        Timeline (sorted by date)
      </div>
      <ol className="space-y-2">
        {result.sorted.map((e, i) => (
          <li key={e.id} className="flex items-start gap-3 text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">
                  {e.title || `Entry ${i + 1}`}
                </span>
                <span className="text-xs text-ink-muted">
                  {formatDate(e.date)}
                </span>
              </div>
              {e.remarks && (
                <div className="text-xs text-ink-muted mt-0.5">{e.remarks}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PairSection({
  pair,
  index,
  defaultOpen,
}: {
  pair: TimelinePair;
  index: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { from, to, diff } = pair;

  return (
    <div className="bg-surface border border-edge rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-accent-soft/60 hover:bg-accent-soft transition text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {open ? (
            <ChevronDown size={18} className="shrink-0" />
          ) : (
            <ChevronRight size={18} className="shrink-0" />
          )}
          <span className="text-xs font-bold text-primary shrink-0">
            STEP {index + 1}
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
            <div className="min-w-0 truncate">
              <span className="font-semibold text-ink">
                {from.title || 'Untitled'}
              </span>
              <span className="text-ink-muted ml-1">
                ({formatDate(from.date)})
              </span>
            </div>
            <ArrowRight size={14} className="text-ink-muted shrink-0" />
            <div className="min-w-0 truncate">
              <span className="font-semibold text-ink">
                {to.title || 'Untitled'}
              </span>
              <span className="text-ink-muted ml-1">
                ({formatDate(to.date)})
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-ink-muted shrink-0 ml-2">
          {diff.counts.total} change{diff.counts.total === 1 ? '' : 's'}
        </span>
      </button>
      {open && (
        <div className="p-4 border-t border-edge">
          <DiffList result={diff} />
        </div>
      )}
    </div>
  );
}
