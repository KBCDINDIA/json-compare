import { create } from 'zustand';
import type { CompareOptions, DiffResult } from './lib/types';
import { defaultOptions } from './lib/types';

interface AppState {
  jsonA: string;
  jsonB: string;
  showB: boolean;
  options: CompareOptions;
  result: DiffResult | null;
  comparing: boolean;
  progress: { stage: string; pct: number } | null;
  setJsonA: (s: string) => void;
  setJsonB: (s: string) => void;
  addB: () => void;
  removeB: () => void;
  setOptions: (o: Partial<CompareOptions>) => void;
  setResult: (r: DiffResult | null) => void;
  setComparing: (b: boolean) => void;
  setProgress: (p: { stage: string; pct: number } | null) => void;
  reset: () => void;
}

export const useApp = create<AppState>((set) => ({
  jsonA: '',
  jsonB: '',
  showB: false,
  options: { ...defaultOptions },
  result: null,
  comparing: false,
  progress: null,
  setJsonA: (s) => set({ jsonA: s }),
  setJsonB: (s) => set({ jsonB: s }),
  addB: () => set({ showB: true }),
  removeB: () => set({ showB: false, jsonB: '', result: null }),
  setOptions: (o) =>
    set((st) => ({ options: { ...st.options, ...o } })),
  setResult: (r) => set({ result: r }),
  setComparing: (b) => set({ comparing: b }),
  setProgress: (p) => set({ progress: p }),
  reset: () =>
    set({
      jsonA: '',
      jsonB: '',
      showB: false,
      result: null,
      comparing: false,
      progress: null,
    }),
}));
