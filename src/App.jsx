import React, { useState, useCallback, useRef } from 'react';
import { parseFile, detectFieldTypes, applyMapping, exportData, downloadFile, TRANSFORMS } from './utils';

// ─── Step Indicator ──────────────────────────────
function Steps({ current }) {
  const steps = ['Upload', 'Inspect', 'Map', 'Export'];
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            i === current ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' :
            i < current ? 'bg-white/5 text-white/60' : 'bg-white/[0.02] text-white/20'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i < current ? 'bg-emerald-500/30 text-emerald-300' :
              i === current ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'
            }`}>{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
          {i < steps.length - 1 && <div className={`w-8 h-px ${i < current ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Upload Step ─────────────────────────────────
function UploadStep({ onParsed }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseFile(file);
      onParsed({ ...result, filename: file.name, size: file.size });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [onParsed]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
          dragging ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".csv,.json" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {loading ? (
          <div className="text-emerald-400 animate-pulse">
            <div className="text-4xl mb-4">⚙️</div>
            <p className="text-sm">Parsing file...</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4">{dragging ? '📂' : '📄'}</div>
            <p className="text-lg font-semibold text-white/80 mb-2">Drop your file here</p>
            <p className="text-sm text-white/30">CSV or JSON — everything runs locally in your browser</p>
            <div className="flex gap-2 justify-center mt-6">
              <span className="px-3 py-1 rounded-full bg-white/5 text-[11px] text-white/40 font-mono">.csv</span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-[11px] text-white/40 font-mono">.json</span>
            </div>
          </>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

// ─── Inspect Step ────────────────────────────────
function InspectStep({ data, types, onContinue }) {
  const { rows, fields, filename, size } = data;
  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{filename}</h2>
          <p className="text-xs text-white/30">{rows.length.toLocaleString()} rows · {fields.length} fields · {(size / 1024).toFixed(1)}KB</p>
        </div>
        <button onClick={onContinue} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors">
          Continue to Mapper →
        </button>
      </div>

      {/* Field cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {fields.map(f => (
          <div key={f} className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
            <div className="font-mono text-xs text-white/80 truncate">{f}</div>
            <div className={`text-[10px] font-medium mt-0.5 type-${types[f]}`}>{types[f]}</div>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-white/[0.01]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#0c0e12] z-10">
            <tr>
              <th className="px-3 py-2 text-left text-white/20 font-mono w-10">#</th>
              {fields.map(f => (
                <th key={f} className="px-3 py-2 text-left text-white/40 font-mono truncate max-w-[200px]">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, i) => (
              <tr key={i} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-3 py-1.5 text-white/15 font-mono">{i + 1}</td>
                {fields.map(f => (
                  <td key={f} className="px-3 py-1.5 text-white/60 font-mono truncate max-w-[200px]">
                    {row[f] === null || row[f] === undefined ? <span className="text-white/15">null</span> : String(row[f])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 50 && <div className="text-center text-[10px] text-white/20 py-2">Showing 50 of {rows.length.toLocaleString()} rows</div>}
      </div>
    </div>
  );
}

// ─── Map Step ────────────────────────────────────
function MapStep({ data, types, mappings, setMappings, onContinue, onBack }) {
  const { rows } = data;
  const preview = applyMapping(rows.slice(0, 10), mappings);

  const updateMapping = (idx, updates) => {
    setMappings(prev => prev.map((m, i) => i === idx ? { ...m, ...updates } : m));
  };

  const moveMapping = (idx, dir) => {
    setMappings(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Field Mapper</h2>
          <p className="text-xs text-white/30">{mappings.filter(m => m.enabled).length} of {mappings.length} fields active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition-colors">← Back</button>
          <button onClick={onContinue} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors">
            Export →
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Mapping rules */}
        <div className="w-1/2 overflow-auto space-y-1.5">
          {mappings.map((m, i) => (
            <div key={m.source} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              !m.enabled ? 'bg-white/[0.01] border-white/[0.03] opacity-40' :
              TRANSFORMS[m.transform]?.group === 'pii' ? 'bg-amber-500/[0.06] border-amber-500/20' :
              'bg-white/[0.03] border-white/10'
            }`}>
              {/* Enable toggle */}
              <button onClick={() => updateMapping(i, { enabled: !m.enabled })}
                className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] ${
                  m.enabled ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300' : 'border-white/20'
                }`}>{m.enabled ? '✓' : ''}</button>

              {/* Source field */}
              <div className="flex items-center gap-1.5 min-w-[120px]">
                <span className={`text-[9px] type-${types[m.source]}`}>●</span>
                <span className="font-mono text-xs text-white/50 truncate">{m.source}</span>
              </div>

              <span className="text-white/15">→</span>

              {/* Target name */}
              <input value={m.target} onChange={(e) => updateMapping(i, { target: e.target.value })}
                className="flex-1 bg-transparent border-b border-white/10 focus:border-emerald-500/50 outline-none font-mono text-xs text-white/80 px-1 py-0.5" />

              {/* Transform */}
              <select value={m.transform} onChange={(e) => updateMapping(i, { transform: e.target.value })}
                className={`bg-white/5 border rounded text-[10px] px-1.5 py-0.5 outline-none ${
                  TRANSFORMS[m.transform]?.group === 'pii' ? 'border-amber-500/30 text-amber-400' : 'border-white/10 text-white/60'
                }`}>
                <optgroup label="Basic">
                  {Object.entries(TRANSFORMS).filter(([,v]) => v.group === 'basic').map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </optgroup>
                <optgroup label="🛡 PII Cleansing">
                  {Object.entries(TRANSFORMS).filter(([,v]) => v.group === 'pii').map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </optgroup>
              </select>

              {/* PII badge */}
              {TRANSFORMS[m.transform]?.group === 'pii' && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold tracking-wider shrink-0">PII</span>
              )}

              {/* Reorder */}
              <div className="flex flex-col gap-0">
                <button onClick={() => moveMapping(i, -1)} className="text-[8px] text-white/20 hover:text-white/60 leading-none">▲</button>
                <button onClick={() => moveMapping(i, 1)} className="text-[8px] text-white/20 hover:text-white/60 leading-none">▼</button>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="w-1/2 overflow-auto rounded-xl border border-white/5 bg-white/[0.01]">
          <div className="sticky top-0 bg-[#0c0e12] px-3 py-2 border-b border-white/5">
            <span className="text-[10px] text-emerald-400/60 font-semibold uppercase tracking-wider">Live Preview</span>
          </div>
          <table className="w-full text-xs">
            <thead className="sticky top-8 bg-[#0c0e12]">
              <tr>
                {mappings.filter(m => m.enabled).map(m => (
                  <th key={m.target} className="px-3 py-2 text-left text-emerald-400/50 font-mono truncate max-w-[160px]">{m.target}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-white/[0.03]">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="px-3 py-1.5 text-white/60 font-mono truncate max-w-[160px]">{String(v ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Export Step ──────────────────────────────────
function ExportStep({ data, mappings, onBack }) {
  const [format, setFormat] = useState('csv');
  const mapped = applyMapping(data.rows, mappings);
  const output = exportData(mapped, format);
  const activeFields = mappings.filter(m => m.enabled).length;

  const handleDownload = () => {
    const base = data.filename.replace(/\.[^.]+$/, '');
    downloadFile(output, `${base}_mapped.${format}`);
  };

  const handleCopySchema = () => {
    const schema = mappings.filter(m => m.enabled).map(m => ({
      source: m.source, target: m.target, transform: m.transform,
      ...(m.defaultValue ? { defaultValue: m.defaultValue } : {}),
    }));
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Export</h2>
          <p className="text-xs text-white/30">{mapped.length.toLocaleString()} rows · {activeFields} fields</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition-colors">← Back</button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Controls */}
        <div className="w-72 space-y-4 shrink-0">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Format</label>
            <div className="flex gap-2">
              {['csv', 'json'].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-mono font-semibold transition-all ${
                    format === f ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>.{f}</button>
              ))}
            </div>
          </div>

          <button onClick={handleDownload}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors text-sm">
            ⬇ Download .{format}
          </button>

          <button onClick={handleCopySchema}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors text-sm">
            📋 Copy schema JSON
          </button>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Stats</label>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-white/30">Rows</span><span className="text-white/60 font-mono">{mapped.length.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/30">Fields</span><span className="text-white/60 font-mono">{activeFields}</span></div>
              <div className="flex justify-between"><span className="text-white/30">Size</span><span className="text-white/60 font-mono">{(output.length / 1024).toFixed(1)}KB</span></div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-white/[0.01]">
          <pre className="p-4 text-xs font-mono text-white/50 whitespace-pre-wrap">{output.slice(0, 5000)}{output.length > 5000 ? '\n\n... truncated preview ...' : ''}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null);
  const [types, setTypes] = useState({});
  const [mappings, setMappings] = useState([]);

  const handleParsed = useCallback((parsed) => {
    const t = detectFieldTypes(parsed.rows);
    const m = parsed.fields.map(f => ({
      source: f,
      target: f,
      transform: 'none',
      enabled: true,
      defaultValue: '',
    }));
    setData(parsed);
    setTypes(t);
    setMappings(m);
    setStep(1);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <span className="text-lg">⚡</span>
          <span className="font-sans text-sm font-bold text-white/80 tracking-wide">DATA MAPPER</span>
          <span className="text-[10px] text-white/20 font-mono ml-2">v0.1</span>
        </div>
        <Steps current={step} />
        {data && (
          <button onClick={() => { setStep(0); setData(null); }}
            className="text-xs text-white/20 hover:text-white/50 transition-colors">Reset</button>
        )}
      </header>

      {/* Content */}
      {step === 0 && <UploadStep onParsed={handleParsed} />}
      {step === 1 && <InspectStep data={data} types={types} onContinue={() => setStep(2)} />}
      {step === 2 && <MapStep data={data} types={types} mappings={mappings} setMappings={setMappings} onContinue={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <ExportStep data={data} mappings={mappings} onBack={() => setStep(2)} />}
    </div>
  );
}
