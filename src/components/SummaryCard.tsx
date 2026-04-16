import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DiffCounts, TimelineResult } from '../lib/types';

interface Props {
  result: TimelineResult;
}

export function SummaryCard({ result }: Props) {
  const counts = result.totalCounts;
  const data = pieData(counts);

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center bg-accent-soft rounded-lg p-4">
          <div className="text-5xl font-bold text-ink">{counts.total}</div>
          <div className="text-sm text-ink-muted mt-1">
            total change{counts.total === 1 ? '' : 's'} across{' '}
            {result.pairs.length} comparison
            {result.pairs.length === 1 ? '' : 's'}
          </div>
          <div className="text-xs text-ink-muted mt-2">
            {result.sorted.length} JSON entries in timeline
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <Row label="🟢 Added" value={counts.added} />
          <Row label="🔴 Removed" value={counts.removed} />
          <Row label="🟡 Changed" value={counts.changed} />
          <Row label="⚠️ Type changed" value={counts.typeChanged} />
          {counts.moved > 0 && <Row label="🔵 Moved" value={counts.moved} />}
        </div>

        <div className="h-40 w-full min-w-0">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={35}
                  outerRadius={65}
                  strokeWidth={2}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-ink-muted">
              No differences
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function pieData(counts: DiffCounts) {
  return [
    { name: 'Added', value: counts.added, color: '#15803D' },
    { name: 'Removed', value: counts.removed, color: '#B91C1C' },
    { name: 'Changed', value: counts.changed, color: '#D97706' },
    { name: 'Type changed', value: counts.typeChanged, color: '#C2410C' },
    { name: 'Moved', value: counts.moved, color: '#1D4ED8' },
  ].filter((d) => d.value > 0);
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
