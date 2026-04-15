import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DiffResult } from '../lib/types';
import { formatBytes } from '../lib/format';

interface Props {
  result: DiffResult;
}

export function SummaryCard({ result }: Props) {
  const { counts, stats } = result;
  const data = [
    { name: 'Added', value: counts.added, color: '#15803D' },
    { name: 'Removed', value: counts.removed, color: '#B91C1C' },
    { name: 'Changed', value: counts.changed, color: '#D97706' },
    { name: 'Type changed', value: counts.typeChanged, color: '#C2410C' },
    { name: 'Moved', value: counts.moved, color: '#1D4ED8' },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center bg-accent-soft rounded-lg p-4">
          <div className="text-5xl font-bold text-ink">{counts.total}</div>
          <div className="text-sm text-ink-muted mt-1">
            {counts.total === 1 ? 'change' : 'changes'} found
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <Row label="🟢 Added" value={counts.added} />
          <Row label="🔴 Removed" value={counts.removed} />
          <Row label="🟡 Changed" value={counts.changed} />
          <Row label="⚠️ Type changed" value={counts.typeChanged} />
          {counts.moved > 0 && <Row label="🔵 Moved" value={counts.moved} />}
          <div className="mt-3 pt-2 border-t border-edge text-xs text-ink-muted">
            <div>
              A: {formatBytes(stats.aBytes)} • {stats.aFields} fields
            </div>
            <div>
              B: {formatBytes(stats.bBytes)} • {stats.bFields} fields
            </div>
          </div>
        </div>

        <div className="h-40">
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

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
