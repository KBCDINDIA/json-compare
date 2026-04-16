import { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Plus,
  GitCompareArrows,
  Download,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { JsonPanel } from './components/JsonPanel';
import { SummaryCard } from './components/SummaryCard';
import { TimelineResults } from './components/TimelineResults';
import { ComparisonTable } from './components/ComparisonTable';
import { StoryView } from './components/StoryView';
import { OptionsPanel } from './components/OptionsPanel';
import { ReportPdf } from './components/ReportPdf';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useApp } from './store';
import { runTimelineDiff } from './lib/diff';

function App() {
  const {
    entries,
    options,
    result,
    comparing,
    setEntry,
    addEntry,
    removeEntry,
    setResult,
    setComparing,
    reset,
  } = useApp();

  const [includeAllInPdf, setIncludeAllInPdf] = useState(false);

  const canCompare = useMemo(() => {
    const valid = entries.filter((e) => {
      if (!e.json.trim()) return false;
      try {
        JSON.parse(e.json);
        return true;
      } catch {
        return false;
      }
    });
    return valid.length >= 2;
  }, [entries]);

  const onCompare = async () => {
    setComparing(true);
    setResult(null);
    try {
      // filter only entries with valid JSON
      const valid = entries.filter((e) => {
        if (!e.json.trim()) return false;
        try {
          JSON.parse(e.json);
          return true;
        } catch {
          return false;
        }
      });
      if (valid.length < 2) {
        toast.error('Need at least 2 entries with valid JSON.');
        return;
      }
      await new Promise((r) => setTimeout(r, 30));
      const r = runTimelineDiff(valid, options);
      setResult(r);
      toast.success(
        r.totalCounts.total === 0
          ? 'No differences found across the timeline.'
          : `Found ${r.totalCounts.total} change${
              r.totalCounts.total === 1 ? '' : 's'
            } across ${r.pairs.length} step${
              r.pairs.length === 1 ? '' : 's'
            }.`,
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

      <header className="border-b border-edge bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <GitCompareArrows className="text-primary" />
              JSON Compare
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Compare any number of JSONs across dates. Download a plain-English
              PDF timeline report.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted bg-primary-soft px-3 py-1.5 rounded-full">
            <Shield size={14} />
            Private — runs in your browser
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            JSON entries ({entries.length})
          </h2>
          <button
            onClick={addEntry}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 text-ink font-semibold text-sm shadow-sm transition"
          >
            <Plus size={16} /> Add entry
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {entries.map((entry, i) => (
            <JsonPanel
              key={entry.id}
              index={i}
              entry={entry}
              canRemove={entries.length > 2}
              onChange={(patch) => setEntry(entry.id, patch)}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onCompare}
            disabled={!canCompare || comparing}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
          >
            <GitCompareArrows size={18} />
            {comparing ? 'Comparing…' : 'Compare timeline'}
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

        {result && (
          <ErrorBoundary label="results">
            <section className="space-y-5 pt-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold text-ink">Timeline Results</h2>
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
                      <ReportPdf
                        result={result}
                        includeAll={includeAllInPdf}
                      />
                    }
                    fileName={`json-compare-timeline-${Date.now()}.pdf`}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 shadow-sm transition"
                  >
                    {({ loading }: { loading: boolean }) => (
                      <>
                        <Download size={16} />
                        {loading ? 'Preparing…' : 'Download PDF'}
                      </>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              <SummaryCard result={result} />
              <TimelineResults result={result} />
              <ComparisonTable result={result} />
              <StoryView result={result} />
            </section>
          </ErrorBoundary>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-ink-muted">
        JSON Compare • Everything runs locally in your browser. Your data never
        leaves this page.
      </footer>
    </div>
  );
}

export default App;
