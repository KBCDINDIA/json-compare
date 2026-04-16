import { create } from 'zustand';
import type {
  CompareOptions,
  JsonEntry,
  TimelineResult,
} from './lib/types';
import { defaultOptions } from './lib/types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeEntry(partial: Partial<JsonEntry> = {}): JsonEntry {
  return {
    id: uid(),
    date: '',
    title: '',
    remarks: '',
    json: '',
    ...partial,
  };
}

interface AppState {
  entries: JsonEntry[];
  options: CompareOptions;
  result: TimelineResult | null;
  comparing: boolean;
  setEntry: (id: string, patch: Partial<JsonEntry>) => void;
  addEntry: () => void;
  removeEntry: (id: string) => void;
  setOptions: (o: Partial<CompareOptions>) => void;
  setResult: (r: TimelineResult | null) => void;
  setComparing: (b: boolean) => void;
  reset: () => void;
}

export const useApp = create<AppState>((set) => ({
  entries: [makeEntry({ title: 'Version 1' }), makeEntry({ title: 'Version 2' })],
  options: { ...defaultOptions },
  result: null,
  comparing: false,
  setEntry: (id, patch) =>
    set((st) => ({
      entries: st.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  addEntry: () =>
    set((st) => ({
      entries: [
        ...st.entries,
        makeEntry({ title: `Version ${st.entries.length + 1}` }),
      ],
    })),
  removeEntry: (id) =>
    set((st) => ({
      entries:
        st.entries.length <= 2 ? st.entries : st.entries.filter((e) => e.id !== id),
      result: null,
    })),
  setOptions: (o) => set((st) => ({ options: { ...st.options, ...o } })),
  setResult: (r) => set({ result: r }),
  setComparing: (b) => set({ comparing: b }),
  reset: () =>
    set({
      entries: [
        makeEntry({ title: 'Version 1' }),
        makeEntry({ title: 'Version 2' }),
      ],
      result: null,
      comparing: false,
    }),
}));
