import React, { useState } from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { useT } from '../../i18n/translations';
import { mmToInch } from '../../utils/calculations';

function CollapseHeader({ label, open, onToggle, badge }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-1.5 group">
      <span className="text-xs font-semibold text-text-dim uppercase tracking-widest group-hover:text-text transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
            {badge}
          </span>
        )}
        <span className={`text-text-dim text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </div>
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-2 mt-4">
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min, max, step, unit }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step || 0.1}
        className="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm text-text focus:border-accent focus:outline-none"
      />
      {unit && <span className="text-xs text-text-dim w-8 shrink-0">{unit}</span>}
    </div>
  );
}

function DimValue({ label, valueMm, unitSystem }) {
  const display =
    unitSystem === 'mm'
      ? `${valueMm != null ? valueMm.toFixed(1) : '—'} mm`
      : `${valueMm != null ? mmToInch(valueMm) : '—'} in`;
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-text-dim">{label}</span>
      <span className="font-mono text-text">{display}</span>
    </div>
  );
}

export default function LayerDesigner() {
  const { layerConfig, updateLayerConfig, results, unitSystem, language } = useBatteryStore();
  const t = useT(language);
  const { dimensions } = results;

  const [open, setOpen] = useState(true);

  const badge = dimensions
    ? `${layerConfig.layers}L · ${dimensions.withBracket.width.toFixed(0)}×${dimensions.withBracket.depth.toFixed(0)}×${dimensions.withBracket.height.toFixed(0)}`
    : undefined;

  return (
    <div>
      <div className="border-b border-border pb-1">
        <CollapseHeader label={t.layerDesigner} open={open} onToggle={() => setOpen(v => !v)} badge={badge} />
      </div>

      {open && <>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <label className="block text-xs text-text-dim mb-1">{t.layers}</label>
          <NumInput
            value={layerConfig.layers}
            onChange={(v) => updateLayerConfig({ layers: Math.min(6, Math.max(1, Math.round(v))) })}
            min={1}
            max={6}
            step={1}
          />
        </div>
        <div>
          <label className="block text-xs text-text-dim mb-1">{t.bracketThickness}</label>
          <NumInput
            value={layerConfig.bracketThickness}
            onChange={(v) => updateLayerConfig({ bracketThickness: Math.max(0, v) })}
            min={0}
            step={0.5}
            unit="mm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-dim mb-1">{t.cellGap}</label>
          <NumInput
            value={layerConfig.cellGap}
            onChange={(v) => updateLayerConfig({ cellGap: Math.max(0, v) })}
            min={0}
            step={0.5}
            unit="mm"
          />
        </div>
      </div>

      {/* Orientation toggle */}
      <div className="mt-3">
        <label className="block text-xs text-text-dim mb-1">{t.orientation}</label>
        <div className="flex gap-1">
          {['vertical', 'horizontal'].map((o) => (
            <button
              key={o}
              onClick={() => updateLayerConfig({ orientation: o })}
              className={`flex-1 text-xs py-1.5 rounded border capitalize transition-colors ${
                layerConfig.orientation === o
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-border text-text-dim hover:border-accent/40'
              }`}
            >
              {o === 'vertical' ? `⬆ ${t.vertical}` : `➡ ${t.horizontal}`}
            </button>
          ))}
        </div>
      </div>

      {/* Layer distribution info */}
      {results.electrical && (
        <div className="mt-2 text-xs text-text-dim bg-panel-light rounded p-2 border border-border">
          <span className="text-text">
            {results.electrical.P}P — {layerConfig.layers} {language === 'tr' ? 'katman' : 'layer'}{layerConfig.layers > 1 && language === 'en' ? 's' : ''}
          </span>
          {' → '}
          {Math.ceil(results.electrical.P / layerConfig.layers)}P {t.perLayer}
        </div>
      )}

      {/* Dimensions display */}
      {dimensions && (
        <>
          <SectionLabel>{t.calculatedDimensions}</SectionLabel>

          <div className="bg-panel-light rounded border border-border p-3 space-y-0.5">
            <div className="text-xs text-accent font-semibold mb-2">{t.perLayerLabel}</div>
            <DimValue label={t.width} valueMm={dimensions.layerWidth} unitSystem={unitSystem} />
            <DimValue label={t.depth} valueMm={dimensions.layerDepth} unitSystem={unitSystem} />
            <DimValue label={t.height} valueMm={dimensions.layerHeight} unitSystem={unitSystem} />

            <div className="border-t border-border my-2" />

            <div className="text-xs text-accent font-semibold mb-2">{t.withoutBracket}</div>
            <DimValue label="W" valueMm={dimensions.withoutBracket.width} unitSystem={unitSystem} />
            <DimValue label="D" valueMm={dimensions.withoutBracket.depth} unitSystem={unitSystem} />
            <DimValue label="H" valueMm={dimensions.withoutBracket.height} unitSystem={unitSystem} />

            {layerConfig.bracketThickness > 0 && (
              <>
                <div className="border-t border-border my-2" />
                <div className="text-xs text-accent font-semibold mb-2">{t.withBracket}</div>
                <DimValue label="W" valueMm={dimensions.withBracket.width} unitSystem={unitSystem} />
                <DimValue label="D" valueMm={dimensions.withBracket.depth} unitSystem={unitSystem} />
                <DimValue label="H" valueMm={dimensions.withBracket.height} unitSystem={unitSystem} />
              </>
            )}

            <div className="border-t border-border my-2" />

            <div className="flex justify-between text-xs py-0.5">
              <span className="text-text-dim">{t.volume}</span>
              <span className="font-mono text-text">{dimensions.volumeL.toFixed(3)} L</span>
            </div>

            {/* Fill ratio bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-dim">{t.fillRatio}</span>
                <span className="font-mono text-text">{dimensions.fillRatio.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dimensions.fillRatio}%`,
                    backgroundColor:
                      dimensions.fillRatio > 80 ? '#ef4444'
                      : dimensions.fillRatio > 60 ? '#f59e0b'
                      : '#00d4ff',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      </>}
    </div>
  );
}
