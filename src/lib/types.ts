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

export interface DiffResult {
  groups: DiffGroup[];
  entries: DiffEntry[];
  topFindings: DiffEntry[];
  counts: {
    added: number;
    removed: number;
    changed: number;
    typeChanged: number;
    moved: number;
    total: number;
  };
  stats: {
    aFields: number;
    bFields: number;
    aBytes: number;
    bBytes: number;
  };
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
