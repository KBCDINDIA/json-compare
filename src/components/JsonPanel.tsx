import { useCallback, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useDropzone } from 'react-dropzone';
import { Check, AlertCircle, Upload, Wand2, X } from 'lucide-react';
import { formatBytes } from '../lib/format';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
}

export function JsonPanel({ label, value, onChange, onRemove }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);

  const validation = useMemo(() => {
    if (!value.trim()) return { ok: false, empty: true, msg: 'Empty' };
    try {
      JSON.parse(value);
      return { ok: true, empty: false, msg: 'Valid JSON' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      return { ok: false, empty: false, msg };
    }
  }, [value]);

  const onDrop = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = () => onChange(String(reader.result ?? ''));
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
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      /* ignore */
    }
  };

  const bytes = new Blob([value]).size;

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col bg-surface border rounded-xl overflow-hidden shadow-sm transition ${
        isDragActive ? 'border-primary ring-2 ring-primary/30' : 'border-edge'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-between px-4 py-2 bg-accent-soft border-b border-edge">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{label}</span>
          {fileName && (
            <span className="text-xs text-ink-muted truncate max-w-[200px]">
              {fileName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
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
          {onRemove && (
            <button
              onClick={onRemove}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-ink-muted hover:bg-white hover:text-sev-remFg transition"
              title="Remove"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="h-[360px]">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(v) => onChange(v ?? '')}
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
