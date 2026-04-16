export type Severity = 'added' | 'removed' | 'changed' | 'typeChanged' | 'moved';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface DiffEntry {
  severity: Severity;
  path: (string | number)[];
  humanPath: string;
  fieldName: string;
  sentence: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
  oldType?: string;
  newType?: string;
  importance: number; // 0..100, higher = more important
}

export interface DiffGroup {
  parentPath: string; // humanized
  rawParent: (string | number)[];
  entries: DiffEntry[];
}

export interface DiffCounts {
  added: number;
  removed: number;
  changed: number;
  typeChanged: number;
  moved: number;
  total: number;
}

export interface DiffResult {
  groups: DiffGroup[];
  entries: DiffEntry[];
  topFindings: DiffEntry[];
  counts: DiffCounts;
  stats: {
    aFields: number;
    bFields: number;
    aBytes: number;
    bBytes: number;
  };
}

export interface JsonEntry {
  id: string;
  date: string; // ISO date string (yyyy-mm-dd) or empty
  title: string;
  remarks: string;
  json: string;
}

export interface TimelinePair {
  from: JsonEntry;
  to: JsonEntry;
  diff: DiffResult;
}

export interface TimelineResult {
  sorted: JsonEntry[]; // entries sorted by date ascending
  pairs: TimelinePair[]; // N-1 pairs
  totalCounts: DiffCounts;
}

export interface CompareOptions {
  ignoreKeyOrder: boolean;
  nullEqualsMissing: boolean;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignorePaths: string[]; // dot paths to ignore
}

export const defaultOptions: CompareOptions = {
  ignoreKeyOrder: true,
  nullEqualsMissing: false,
  ignoreWhitespace: true,
  ignoreCase: false,
  ignorePaths: [],
};
