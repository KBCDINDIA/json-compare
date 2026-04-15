import diff from 'microdiff';
import type {
  CompareOptions,
  DiffEntry,
  DiffGroup,
  DiffResult,
  JsonValue,
  Severity,
} from './types';
import {
  countFields,
  fieldNameFromPath,
  formatValue,
  friendlyType,
  friendlyTypeName,
  humanizePath,
  parentPath,
} from './humanize';

function normalizeString(s: string, opts: CompareOptions): string {
  let out = s;
  if (opts.ignoreWhitespace) out = out.trim();
  if (opts.ignoreCase) out = out.toLowerCase();
  return out;
}

function preprocess(v: JsonValue, opts: CompareOptions): JsonValue {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') return normalizeString(v, opts);
  if (Array.isArray(v)) return v.map((x) => preprocess(x as JsonValue, opts));
  if (typeof v === 'object') {
    const out: Record<string, JsonValue> = {};
    const keys = Object.keys(v);
    if (opts.ignoreKeyOrder) keys.sort();
    for (const k of keys) {
      const val = (v as Record<string, JsonValue>)[k];
      if (opts.nullEqualsMissing && val === null) continue;
      out[k] = preprocess(val, opts);
    }
    return out;
  }
  return v;
}

function pathMatchesIgnore(path: (string | number)[], ignore: string[]): boolean {
  if (ignore.length === 0) return false;
  const dotted = path.map((p) => String(p)).join('.');
  return ignore.some((pat) => {
    const clean = pat.trim();
    if (!clean) return false;
    return dotted === clean || dotted.startsWith(clean + '.') || path.some((p) => String(p) === clean);
  });
}

function buildSentence(
  severity: Severity,
  path: (string | number)[],
  oldValue: JsonValue | undefined,
  newValue: JsonValue | undefined,
): string {
  const field = fieldNameFromPath(path);
  switch (severity) {
    case 'added': {
      if (newValue !== null && typeof newValue === 'object') {
        const fields = Array.isArray(newValue)
          ? `${newValue.length} item${newValue.length === 1 ? '' : 's'}`
          : `${Object.keys(newValue).length} field${Object.keys(newValue).length === 1 ? '' : 's'}`;
        return `A new ${field} was added with ${fields} inside.`;
      }
      return `A new ${field} was added with value ${formatValue(newValue)}.`;
    }
    case 'removed': {
      if (oldValue !== null && typeof oldValue === 'object') {
        const fields = Array.isArray(oldValue)
          ? `${oldValue.length} item${oldValue.length === 1 ? '' : 's'}`
          : `${Object.keys(oldValue).length} field${Object.keys(oldValue).length === 1 ? '' : 's'}`;
        return `The ${field} (with ${fields} inside) was removed.`;
      }
      return `${field} was removed. It previously was ${formatValue(oldValue)}.`;
    }
    case 'changed':
      return `${field} changed from ${formatValue(oldValue)} to ${formatValue(newValue)}.`;
    case 'typeChanged':
      return `⚠️ ${field} used to be ${friendlyTypeName(oldValue)}, now it is ${friendlyTypeName(newValue)}.`;
    case 'moved':
      return `${field} moved position.`;
  }
}

function scoreImportance(severity: Severity, oldValue?: JsonValue, newValue?: JsonValue): number {
  switch (severity) {
    case 'typeChanged':
      return 95;
    case 'removed':
      return 80;
    case 'added':
      return 60;
    case 'changed': {
      // larger numeric deltas count more
      if (typeof oldValue === 'number' && typeof newValue === 'number') {
        const denom = Math.max(Math.abs(oldValue), 1);
        const delta = Math.abs(newValue - oldValue) / denom;
        return Math.min(75, 40 + Math.round(delta * 30));
      }
      return 50;
    }
    case 'moved':
      return 20;
  }
}

export function runDiff(
  a: JsonValue,
  b: JsonValue,
  opts: CompareOptions,
  rawA?: string,
  rawB?: string,
): DiffResult {
  const pa = preprocess(a, opts);
  const pb = preprocess(b, opts);

  const raw = diff(
    pa as unknown as Record<string, unknown>,
    pb as unknown as Record<string, unknown>,
  );

  const entries: DiffEntry[] = [];

  for (const d of raw) {
    const path = d.path as (string | number)[];
    if (pathMatchesIgnore(path, opts.ignorePaths)) continue;

    let severity: Severity;
    let oldValue: JsonValue | undefined;
    let newValue: JsonValue | undefined;
    let oldType: string | undefined;
    let newType: string | undefined;

    if (d.type === 'CREATE') {
      severity = 'added';
      newValue = d.value as JsonValue;
      newType = friendlyType(newValue);
    } else if (d.type === 'REMOVE') {
      severity = 'removed';
      oldValue = (d as { oldValue: JsonValue }).oldValue;
      oldType = friendlyType(oldValue);
    } else {
      // CHANGE
      oldValue = (d as { oldValue: JsonValue }).oldValue;
      newValue = d.value as JsonValue;
      oldType = friendlyType(oldValue);
      newType = friendlyType(newValue);
      severity = oldType !== newType ? 'typeChanged' : 'changed';
    }

    const entry: DiffEntry = {
      severity,
      path,
      humanPath: humanizePath(path),
      fieldName: fieldNameFromPath(path),
      sentence: buildSentence(severity, path, oldValue, newValue),
      oldValue,
      newValue,
      oldType,
      newType,
      importance: scoreImportance(severity, oldValue, newValue),
    };
    entries.push(entry);
  }

  // Group by parent
  const groupMap = new Map<string, DiffGroup>();
  for (const e of entries) {
    const pp = parentPath(e.path);
    const key = pp.map((x) => String(x)).join('\x00');
    let g = groupMap.get(key);
    if (!g) {
      g = {
        parentPath: humanizePath(pp),
        rawParent: pp,
        entries: [],
      };
      groupMap.set(key, g);
    }
    g.entries.push(e);
  }

  const groups = Array.from(groupMap.values()).sort((x, y) => {
    const xi = Math.max(...x.entries.map((e) => e.importance));
    const yi = Math.max(...y.entries.map((e) => e.importance));
    return yi - xi;
  });

  const counts = {
    added: 0,
    removed: 0,
    changed: 0,
    typeChanged: 0,
    moved: 0,
    total: entries.length,
  };
  for (const e of entries) {
    if (e.severity === 'added') counts.added++;
    else if (e.severity === 'removed') counts.removed++;
    else if (e.severity === 'changed') counts.changed++;
    else if (e.severity === 'typeChanged') counts.typeChanged++;
    else if (e.severity === 'moved') counts.moved++;
  }

  const topFindings = [...entries]
    .sort((x, y) => y.importance - x.importance)
    .slice(0, 5);

  return {
    groups,
    entries,
    topFindings,
    counts,
    stats: {
      aFields: countFields(a),
      bFields: countFields(b),
      aBytes: rawA ? new Blob([rawA]).size : 0,
      bBytes: rawB ? new Blob([rawB]).size : 0,
    },
  };
}
