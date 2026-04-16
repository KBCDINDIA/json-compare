import { useCallback, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useDropzone } from 'react-dropzone';
import { Check, AlertCircle, Upload, Wand2, X, Calendar } from 'lucide-react';
import { formatBytes } from '../lib/format';
import type { JsonEntry } from '../lib/types';

interface Props {
  index: number;
  entry: JsonEntry;
  canRemove: boolean;
  onChange: (patch: Partial<JsonEntry>) => void;
  onRemove: () => void;
}

export function JsonPanel({ index, entry, canRemove, onChange, onRemove }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);

  const validation = useMemo(() => {
    if (!entry.json.trim()) return { ok: false, empty: true, msg: 'Empty' };
    try {
      JSON.parse(entry.json);
      return { ok: true, empty: false, msg: 'Valid JSON' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      return { ok: false, empty: false, msg };
    }
  }, [entry.json]);

  const onDrop = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = () => onChange({ json: String(reader.result ?? '') });
      reader.readAsText(f);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'], 'text/plain': ['.txt'] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const format = () => {
    try {
      const parsed = JSON.parse(entry.json);
      onChange({ json: JSON.stringify(parsed, null, 2) });
    } catch {
      /* ignore */
    }
  };

  const bytes = new Blob([entry.json]).size;

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col bg-surface border rounded-xl overflow-hidden shadow-sm transition ${
        isDragActive ? 'border-primary ring-2 ring-primary/30' : 'border-edge'
      }`}
    >
      <input {...getInputProps()} />

      {/* Meta header */}
      <div className="px-4 py-3 bg-accent-soft border-b border-edge">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              {index + 1}
            </span>
            <input
              value={entry.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Title (e.g. Before deploy)"
              className="flex-1 bg-transparent outline-none font-semibold text-ink placeholder:text-ink-muted/60 min-w-0 w-40"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={open}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-ink-muted hover:bg-white hover:text-primary transition"
              title="Load file"
            >
              <Upload size={14} /> Load
            </button>
            <button
              onClick={format}
              disabled={!validation.ok}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-ink-muted hover:bg-white hover:text-primary transition disabled:opacity-40"
              title="Format JSON"
            >
              <Wand2 size={14} /> Format
            </button>
            {canRemove && (
              <button
                onClick={onRemove}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-ink-muted hover:bg-white hover:text-sev-remFg transition"
                title="Remove this entry"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 text-xs">
          <label className="flex items-center gap-1.5 bg-white border border-edge rounded-md px-2 py-1">
            <Calendar size={12} className="text-ink-muted" />
            <input
              type="date"
              value={entry.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="bg-transparent outline-none text-ink"
            />
          </label>
          <input
            value={entry.remarks}
            onChange={(e) => onChange({ remarks: e.target.value })}
            placeholder="Remarks (optional) — e.g. after API change"
            className="bg-white border border-edge rounded-md px-2 py-1 outline-none text-ink placeholder:text-ink-muted/60"
          />
        </div>

        {fileName && (
          <div className="mt-1 text-xs text-ink-muted truncate">📄 {fileName}</div>
        )}
      </div>

      <div className="h-[320px]">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={entry.json}
          onChange={(v) => onChange({ json: v ?? '' })}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-edge bg-white text-xs">
        <div className="flex items-center gap-2">
          {validation.empty ? (
            <span className="text-ink-muted">Paste JSON or drop a file</span>
          ) : validation.ok ? (
            <>
              <Check size={14} className="text-sev-addFg" />
              <span className="text-sev-addFg font-medium">Valid JSON</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="text-sev-remFg" />
              <span className="text-sev-remFg truncate max-w-[300px]">
                {validation.msg}
              </span>
            </>
          )}
        </div>
        <span className="text-ink-muted">{formatBytes(bytes)}</span>
      </div>
    </div>
  );
}
