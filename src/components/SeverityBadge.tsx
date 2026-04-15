import type { Severity } from '../lib/types';

const MAP: Record<Severity, { bg: string; fg: string; label: string; dot: string }> = {
  added: { bg: 'bg-sev-addBg', fg: 'text-sev-addFg', label: 'Added', dot: '🟢' },
  removed: { bg: 'bg-sev-remBg', fg: 'text-sev-remFg', label: 'Removed', dot: '🔴' },
  changed: { bg: 'bg-sev-chgBg', fg: 'text-sev-chgFg', label: 'Changed', dot: '🟡' },
  typeChanged: {
    bg: 'bg-sev-typBg',
    fg: 'text-sev-typFg',
    label: 'Type changed',
    dot: '⚠️',
  },
  moved: { bg: 'bg-sev-movBg', fg: 'text-sev-movFg', label: 'Moved', dot: '🔵' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = MAP[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.fg}`}
    >
      <span>{m.dot}</span>
      <span>{m.label}</span>
    </span>
  );
}

export const SEVERITY_META = MAP;
