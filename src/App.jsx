import React, { useRef, useCallback } from 'react';
import { useBatteryStore } from './store/batteryStore';
import { useT } from './i18n/translations';
import CellLibrary from './components/CellLibrary';
import PackCalculator from './components/PackCalculator';
import LayerDesigner from './components/LayerDesigner';
import Visualizer3D from './components/Visualizer3D';
import ResultsPanel from './components/ResultsPanel';
import { exportPDF, exportCSV } from './utils/export';

function Toolbar({ visualizerRef }) {
  const { resetPack, unitSystem, setUnitSystem, language, setLanguage, results } = useBatteryStore();
  const t = useT(language);

  const handleExportPDF = useCallback(() => {
    const store = useBatteryStore.getState();
    exportPDF(store, visualizerRef);
  }, [visualizerRef]);

  const handleExportCSV = useCallback(() => {
    const store = useBatteryStore.getState();
    exportCSV(store);
  }, []);

  return (
    <header className="h-12 bg-panel border-b border-border flex items-center px-4 gap-3 shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 bg-accent/20 border border-accent/40 rounded flex items-center justify-center">
          <span className="text-accent text-xs font-bold">BF</span>
        </div>
        <span className="font-semibold text-text text-sm tracking-wide">{t.appName}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <button
        onClick={resetPack}
        className="text-xs px-3 py-1.5 rounded border border-border text-text-dim hover:border-accent/50 hover:text-accent transition-colors"
      >
        {t.newPack}
      </button>

      <button
        onClick={handleExportPDF}
        className="text-xs px-3 py-1.5 rounded border border-border text-text-dim hover:border-accent/50 hover:text-accent transition-colors"
      >
        {t.exportPDF}
      </button>
      <button
        onClick={handleExportCSV}
        className="text-xs px-3 py-1.5 rounded border border-border text-text-dim hover:border-accent/50 hover:text-accent transition-colors"
      >
        {t.exportCSV}
      </button>

      <div className="flex-1" />

      {/* Pack info badge */}
      {results?.electrical && (
        <div className="text-xs font-mono bg-panel-light border border-border rounded px-3 py-1">
          <span className="text-accent">{results.electrical.S}S{results.electrical.P}P</span>
          <span className="text-text-dim mx-2">·</span>
          <span className="text-text">{results.electrical.packVoltage.toFixed(1)}V</span>
          <span className="text-text-dim mx-1">/</span>
          <span className="text-text">{results.electrical.energyWh.toFixed(0)}Wh</span>
        </div>
      )}

      {/* Language toggle */}
      <div className="flex border border-border rounded overflow-hidden">
        {['tr', 'en'].map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`text-xs px-2.5 py-1.5 transition-colors font-medium uppercase ${
              language === lang
                ? 'bg-accent/20 text-accent'
                : 'text-text-dim hover:text-text bg-transparent'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Unit toggle */}
      <button
        onClick={() => setUnitSystem(unitSystem === 'mm' ? 'inch' : 'mm')}
        className={`text-xs px-3 py-1.5 rounded border transition-colors font-mono ${
          unitSystem === 'inch'
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-text-dim hover:border-accent/40'
        }`}
      >
        {unitSystem === 'mm' ? 'mm' : 'in'}
      </button>
    </header>
  );
}

export default function App() {
  const visualizerRef = useRef(null);
  const { language } = useBatteryStore();
  const t = useT(language);

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden">
      <Toolbar visualizerRef={visualizerRef} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[380px] shrink-0 bg-panel border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-bg scrollbar-thumb-border">
            <CellLibrary />
            <PackCalculator />
            <LayerDesigner />
          </div>
        </aside>

        {/* Center: 3D Visualizer */}
        <main className="flex-1 p-3" ref={visualizerRef}>
          <Visualizer3D />
        </main>

        {/* Right panel */}
        <aside className="w-[320px] shrink-0 bg-panel border-l border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-bg scrollbar-thumb-border">
            <div className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">
              {t.results}
            </div>
            <ResultsPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
