import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Plus, GitCompareArrows, Download, RotateCcw, Shield } from 'lucide-react';
import { JsonPanel } from './components/JsonPanel';
import { SummaryCard } from './components/SummaryCard';
import { DiffList } from './components/DiffList';
import { SideBySide } from './components/SideBySide';
import { OptionsPanel } from './components/OptionsPanel';
import { ReportPdf } from './components/ReportPdf';
import { useApp } from './store';
import { runDiff } from './lib/diff';
import type { JsonValue } from './lib/types';

type View = 'plain' | 'side';

function App() {
  const {
    jsonA,
    jsonB,
    showB,
    options,
    result,
    comparing,
    setJsonA,
    setJsonB,
    addB,
    removeB,
    setResult,
    setComparing,
    reset,
  } = useApp();

  const [view, setView] = useState<View>('plain');
  const [includeAllInPdf, setIncludeAllInPdf] = useState(false);

  const parsed = useMemo(() => {
    if (!result) return null;
    try {
      return {
        a: JSON.parse(jsonA) as JsonValue,
        b: JSON.parse(jsonB) as JsonValue,
      };
    } catch {
      return null;
    }
  }, [result, jsonA, jsonB]);

  const canCompare = useMemo(() => {
    if (!jsonA.trim() || !jsonB.trim()) return false;
    try {
      JSON.parse(jsonA);
      JSON.parse(jsonB);
      return true;
    } catch {
      return false;
    }
  }, [jsonA, jsonB]);

  const onCompare = async () => {
    setComparing(true);
    setResult(null);
    try {
      const a = JSON.parse(jsonA) as JsonValue;
      const b = JSON.parse(jsonB) as JsonValue;
      // defer to next frame so spinner can render
      await new Promise((r) => setTimeout(r, 30));
      const r = runDiff(a, b, options, jsonA, jsonB);
      setResult(r);
      toast.success(
        r.counts.total === 0
          ? 'No differences found — the documents match.'
          : `Found ${r.counts.total} change${r.counts.total === 1 ? '' : 's'}.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="border-b border-edge bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <GitCompareArrows className="text-primary" />
              JSON Compare
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Compare two JSONs and download a plain-English PDF report.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted bg-primary-soft px-3 py-1.5 rounded-full">
            <Shield size={14} />
            Private — runs in your browser
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <JsonPanel label="JSON A" value={jsonA} onChange={setJsonA} />
          {showB ? (
            <JsonPanel
              label="JSON B"
              value={jsonB}
              onChange={setJsonB}
              onRemove={removeB}
            />
          ) : (
            <button
              onClick={addB}
              className="flex flex-col items-center justify-center h-[460px] border-2 border-dashed border-accent rounded-xl bg-accent-soft/40 hover:bg-accent-soft transition text-ink"
            >
              <Plus size={40} className="text-primary mb-2" />
              <div className="font-semibold">Add JSON B</div>
              <div className="text-sm text-ink-muted mt-1">
                Click to add the second document
              </div>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onCompare}
            disabled={!canCompare || comparing}
            className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/80 text-ink font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
          >
            <GitCompareArrows size={18} />
            {comparing ? 'Comparing…' : 'Compare'}
          </button>
          {result && (
            <button
              onClick={reset}
              className="px-4 py-3 rounded-lg border border-edge bg-surface hover:bg-primary-soft text-ink-muted hover:text-primary flex items-center justify-center gap-2 transition"
            >
              <RotateCcw size={16} /> Reset
            </button>
          )}
          <div className="flex-1">
            <OptionsPanel />
          </div>
        </div>

        {/* Results */}
        {result && parsed && (
          <section className="space-y-5 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold text-ink">Results</h2>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-ink-muted mr-2">
                  <input
                    type="checkbox"
                    checked={includeAllInPdf}
                    onChange={(e) => setIncludeAllInPdf(e.target.checked)}
                    className="accent-primary"
                  />
                  Include all in PDF
                </label>
                <PDFDownloadLink
                  document={
                    <ReportPdf result={result} includeAll={includeAllInPdf} />
                  }
                  fileName={`json-compare-${Date.now()}.pdf`}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  {({ loading }) => (
                    <>
                      <Download size={16} />
                      {loading ? 'Preparing…' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            </div>

            <SummaryCard result={result} />

            <div className="flex items-center gap-2 border-b border-edge">
              <TabBtn
                active={view === 'plain'}
                onClick={() => setView('plain')}
              >
                Plain English
              </TabBtn>
              <TabBtn
                active={view === 'side'}
                onClick={() => setView('side')}
              >
                Side-by-side
              </TabBtn>
            </div>

            {view === 'plain' ? (
              <DiffList result={result} />
            ) : (
              <SideBySide a={parsed.a} b={parsed.b} />
            )}
          </section>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-ink-muted">
        JSON Compare • Everything runs locally in your browser. Your data never
        leaves this page.
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
