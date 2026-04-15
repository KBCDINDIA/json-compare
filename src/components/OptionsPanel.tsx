import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../store';

export function OptionsPanel() {
  const [open, setOpen] = useState(false);
  const { options, setOptions } = useApp();

  return (
    <div className="bg-surface border border-edge rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-primary"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Advanced options
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 text-sm border-t border-edge">
          <Check
            label="Ignore key order in objects"
            checked={options.ignoreKeyOrder}
            onChange={(v) => setOptions({ ignoreKeyOrder: v })}
          />
          <Check
            label="Treat null and missing field as the same"
            checked={options.nullEqualsMissing}
            onChange={(v) => setOptions({ nullEqualsMissing: v })}
          />
          <Check
            label="Ignore whitespace around text values"
            checked={options.ignoreWhitespace}
            onChange={(v) => setOptions({ ignoreWhitespace: v })}
          />
          <Check
            label="Ignore letter case in text values"
            checked={options.ignoreCase}
            onChange={(v) => setOptions({ ignoreCase: v })}
          />
          <div>
            <label className="block text-ink-muted mb-1">
              Ignore these paths (comma-separated, e.g. updatedAt, meta.timestamp)
            </label>
            <input
              value={options.ignorePaths.join(', ')}
              onChange={(e) =>
                setOptions({
                  ignorePaths: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-1.5 border border-edge rounded-md text-sm outline-none focus:border-primary"
              placeholder="updatedAt, createdAt"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-primary"
      />
      <span className="text-ink">{label}</span>
    </label>
  );
}
