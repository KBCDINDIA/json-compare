import { useEffect, useRef } from 'react';
import * as jsondiffpatch from 'jsondiffpatch';
import * as htmlFormatter from 'jsondiffpatch/formatters/html';
import 'jsondiffpatch/formatters/styles/html.css';
import type { JsonValue } from '../lib/types';

interface Props {
  a: JsonValue;
  b: JsonValue;
}

const dpInstance = jsondiffpatch.create({
  objectHash: (obj: object, index?: number) => {
    if (obj && typeof obj === 'object') {
      const o = obj as Record<string, unknown>;
      return String(o.id ?? o._id ?? o.key ?? o.name ?? `$$index:${index ?? 0}`);
    }
    return `$$index:${index ?? 0}`;
  },
  arrays: { detectMove: true, includeValueOnMove: false },
});

export function SideBySide({ a, b }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const delta = dpInstance.diff(a, b);
    if (!delta) {
      ref.current.innerHTML =
        '<div style="padding:16px;color:#64748B;">No differences.</div>';
      return;
    }
    ref.current.innerHTML = htmlFormatter.format(delta, a) ?? '';
  }, [a, b]);

  return (
    <div className="bg-surface border border-edge rounded-xl p-4 shadow-sm overflow-auto max-h-[600px]">
      <div ref={ref} className="jsondiffpatch-view text-sm" />
    </div>
  );
}
