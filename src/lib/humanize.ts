import type { JsonValue } from './types';

const TYPE_FRIENDLY: Record<string, string> = {
  string: 'text',
  number: 'number',
  boolean: 'yes/no value',
  object: 'group of settings',
  array: 'list',
  null: 'empty',
  undefined: 'empty',
};

export function friendlyType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function friendlyTypeName(v: unknown): string {
  return TYPE_FRIENDLY[friendlyType(v)] ?? 'value';
}

export function humanizeKey(key: string): string {
  // camelCase / snake_case / kebab-case → words
  if (!key) return key;
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .trim();
}

export function humanizePath(path: (string | number)[]): string {
  if (path.length === 0) return 'root';
  return path
    .map((seg) => {
      if (typeof seg === 'number') return `item #${seg + 1}`;
      return humanizeKey(seg);
    })
    .join(' → ');
}

export function fieldNameFromPath(path: (string | number)[]): string {
  if (path.length === 0) return 'the document';
  const last = path[path.length - 1];
  if (typeof last === 'number') {
    const parent = path[path.length - 2];
    return typeof parent === 'string'
      ? `item #${last + 1} of ${humanizeKey(parent)}`
      : `item #${last + 1}`;
  }
  return humanizeKey(last);
}

export function parentPath(path: (string | number)[]): (string | number)[] {
  return path.slice(0, -1);
}

const MAX_INLINE = 60;

export function formatValue(v: JsonValue | undefined): string {
  if (v === undefined) return '(missing)';
  if (v === null) return 'empty';
  if (typeof v === 'string') {
    if (v.length === 0) return '""';
    if (v.length > MAX_INLINE) return `"${v.slice(0, MAX_INLINE)}…"`;
    return `"${v}"`;
  }
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? '' : 's'}]`;
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    return `{${keys.length} field${keys.length === 1 ? '' : 's'}}`;
  }
  return String(v);
}

export function countFields(v: JsonValue): number {
  if (v === null || typeof v !== 'object') return 1;
  if (Array.isArray(v)) {
    let total = 0;
    for (const x of v) total += countFields(x as JsonValue);
    return total;
  }
  let total = 0;
  for (const x of Object.values(v)) total += countFields(x as JsonValue);
  return total;
}
