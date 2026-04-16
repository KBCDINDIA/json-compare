import type { JsonEntry, JsonValue } from './types';
import { humanizeKey } from './humanize';

export interface FlatRow {
  path: string[];        // raw path segments
  humanLabel: string;    // humanized full path
  indent: number;        // nesting depth
  values: (string | null)[]; // one per entry, null = field absent
  rawValues: (JsonValue | undefined)[]; // for type detection
}

export interface ComparisonData {
  headers: { title: string; date: string; remarks: string }[];
  rows: FlatRow[];
  changedRows: FlatRow[];  // only rows where at least one value differs
}

function flatten(
  obj: JsonValue,
  prefix: string[],
  out: Map<string, { path: string[]; raw: JsonValue }>,
): void {
  if (obj === null || obj === undefined) {
    out.set(prefix.join('\x00'), { path: prefix, raw: obj });
    return;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      out.set(prefix.join('\x00'), { path: prefix, raw: obj });
      return;
    }
    for (let i = 0; i < obj.length; i++) {
      flatten(obj[i] as JsonValue, [...prefix, String(i)], out);
    }
    return;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      out.set(prefix.join('\x00'), { path: prefix, raw: obj });
      return;
    }
    for (const k of keys) {
      flatten((obj as Record<string, JsonValue>)[k], [...prefix, k], out);
    }
    return;
  }
  // scalar
  out.set(prefix.join('\x00'), { path: prefix, raw: obj });
}

function formatCellValue(v: JsonValue | undefined): string | null {
  if (v === undefined) return null;
  if (v === null) return '(empty)';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (typeof v === 'object') return `{${Object.keys(v).length} fields}`;
  return String(v);
}

function humanizePath(path: string[]): string {
  return path
    .map((seg) => {
      if (/^\d+$/.test(seg)) return `Item #${Number(seg) + 1}`;
      return humanizeKey(seg);
    })
    .join(' → ');
}

export function buildComparisonData(
  sortedEntries: JsonEntry[],
): ComparisonData {
  const headers = sortedEntries.map((e, i) => ({
    title: e.title || `Version ${i + 1}`,
    date: e.date || '',
    remarks: e.remarks || '',
  }));

  // Flatten each entry's JSON
  const flatMaps: Map<string, { path: string[]; raw: JsonValue }>[] = [];
  for (const entry of sortedEntries) {
    const map = new Map<string, { path: string[]; raw: JsonValue }>();
    try {
      const parsed = JSON.parse(entry.json) as JsonValue;
      flatten(parsed, [], map);
    } catch {
      // skip invalid
    }
    flatMaps.push(map);
  }

  // Collect all unique paths preserving first-seen order
  const allKeys: string[] = [];
  const seen = new Set<string>();
  for (const map of flatMaps) {
    for (const key of map.keys()) {
      if (!seen.has(key)) {
        seen.add(key);
        allKeys.push(key);
      }
    }
  }

  // Sort paths: by first segment, then by array index numerically, then rest alphabetically
  allKeys.sort((a, b) => {
    const pa = a.split('\x00');
    const pb = b.split('\x00');
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const sa = pa[i] ?? '';
      const sb = pb[i] ?? '';
      // Both numeric → sort numerically
      if (/^\d+$/.test(sa) && /^\d+$/.test(sb)) {
        const diff = Number(sa) - Number(sb);
        if (diff !== 0) return diff;
        continue;
      }
      const cmp = sa.localeCompare(sb);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });

  // Build rows
  const rows: FlatRow[] = [];
  for (const key of allKeys) {
    const firstMap = flatMaps.find((m) => m.has(key));
    const path = firstMap?.get(key)?.path ?? key.split('\x00');

    const rawValues: (JsonValue | undefined)[] = [];
    const values: (string | null)[] = [];
    for (const map of flatMaps) {
      const entry = map.get(key);
      if (entry) {
        rawValues.push(entry.raw);
        values.push(formatCellValue(entry.raw));
      } else {
        rawValues.push(undefined);
        values.push(null);
      }
    }

    rows.push({
      path,
      humanLabel: humanizePath(path),
      indent: path.length - 1,
      values,
      rawValues,
    });
  }

  // Changed rows: at least one value differs from another
  const changedRows = rows.filter((row) => {
    const nonNull = row.values.filter((v) => v !== null);
    if (nonNull.length <= 1) {
      // field exists in 0 or 1 version → it was added/removed → changed
      return row.values.some((v) => v !== null) && row.values.some((v) => v === null);
    }
    return !nonNull.every((v) => v === nonNull[0]);
  });

  return { headers, rows, changedRows };
}

export type CellStatus = 'same' | 'changed' | 'added' | 'removed' | 'type-changed' | 'absent';

export function getCellStatus(
  row: FlatRow,
  colIdx: number,
): CellStatus {
  const val = row.values[colIdx];
  const raw = row.rawValues[colIdx];

  if (val === null) {
    // field not present in this version
    // was it present in any previous version?
    const existedBefore = row.values.slice(0, colIdx).some((v) => v !== null);
    return existedBefore ? 'removed' : 'absent';
  }

  if (colIdx === 0) {
    // first column — no previous to compare
    return 'same';
  }

  // Find previous non-absent value
  let prevIdx = colIdx - 1;
  while (prevIdx >= 0 && row.values[prevIdx] === null) prevIdx--;

  if (prevIdx < 0) {
    // didn't exist in any previous → added
    return 'added';
  }

  const prevVal = row.values[prevIdx];
  const prevRaw = row.rawValues[prevIdx];

  if (val === prevVal) return 'same';

  // Type change?
  const curType = raw === null ? 'null' : Array.isArray(raw) ? 'array' : typeof raw;
  const prvType = prevRaw === null ? 'null' : Array.isArray(prevRaw) ? 'array' : typeof prevRaw;
  if (curType !== prvType && prevRaw !== undefined) return 'type-changed';

  return 'changed';
}
