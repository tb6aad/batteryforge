import React, { useState } from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { useT } from '../../i18n/translations';

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

function Field({ label, children, hint }) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-text-dim mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-dim mt-1">{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min, max, step, unit, disabled }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step || 1}
        disabled={disabled}
        className="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm text-text focus:border-accent focus:outline-none disabled:opacity-50"
      />
      {unit && <span className="text-xs text-text-dim w-10 shrink-0">{unit}</span>}
    </div>
  );
}

function ResultBadge({ label, value, unit }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-text-dim">{label}</span>
      <span className="text-sm font-mono text-accent font-semibold">
        {value}<span className="text-xs font-normal text-text-dim ml-1">{unit}</span>
      </span>
    </div>
  );
}

export default function PackCalculator() {
  const {
    packConfig, updatePackConfig, updateConstraints,
    calcMode, setCalcMode,
    spConfig, updateSpConfig,
    results, selectedCell, language,
  } = useBatteryStore();
  const t = useT(language);
  const { electrical, alternatives } = results;

  const [open, setOpen] = useState(true);

  function toggleCapacityUnit() {
    const next = packConfig.capacityUnit === 'Ah' ? 'Wh' : 'Ah';
    // When switching to Wh, seed from current Ah × voltage
    if (next === 'Wh' && electrical) {
      updatePackConfig({ capacityUnit: next, targetCapacityWh: Math.round(electrical.energyWh) });
    } else {
      updatePackConfig({ capacityUnit: next });
    }
  }

  const badge = electrical ? `${electrical.S}S${electrical.P}P · ${electrical.packVoltage.toFixed(1)}V` : undefined;

  return (
    <div>
      <div className="border-b border-border pb-1">
        <CollapseHeader label={t.packCalculator} open={open} onToggle={() => setOpen(v => !v)} badge={badge} />
      </div>

      {open && <>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-3">
        {['target', 'sp'].map((mode) => (
          <button
            key={mode}
            onClick={() => setCalcMode(mode)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
              calcMode === mode
                ? 'border-accent bg-accent/20 text-accent font-semibold'
                : 'border-border text-text-dim hover:border-accent/40'
            }`}
          >
            {mode === 'target' ? t.modeTarget : t.modeSP}
          </button>
        ))}
      </div>

      {/* ── TARGET MODE: enter voltage + capacity → compute S, P ── */}
      {calcMode === 'target' && (
        <>
          <Field
            label={t.targetVoltage}
            hint={selectedCell && electrical
              ? `${selectedCell.nominalVoltage}V × ${electrical.S}S = ${electrical.packVoltage.toFixed(1)}V`
              : undefined}
          >
            <NumInput
              value={packConfig.targetVoltage}
              onChange={(v) => updatePackConfig({ targetVoltage: v })}
              min={3.6} max={1000} step={0.1} unit="V"
            />
          </Field>

          <Field
            label={
              <div className="flex items-center justify-between">
                <span>{t.targetCapacity}</span>
                <button
                  onClick={toggleCapacityUnit}
                  className="text-xs px-2 py-0.5 rounded bg-panel-light border border-border text-accent hover:border-accent transition-colors"
                >
                  {packConfig.capacityUnit}
                </button>
              </div>
            }
            hint={electrical
              ? `${electrical.P}P = ${electrical.packCapacityAh.toFixed(2)} Ah / ${electrical.energyWh.toFixed(0)} Wh`
              : undefined}
          >
            {packConfig.capacityUnit === 'Ah' ? (
              <NumInput
                value={packConfig.targetCapacityAh}
                onChange={(v) => updatePackConfig({ targetCapacityAh: v })}
                min={0.1} step={0.5} unit="Ah"
              />
            ) : (
              <NumInput
                value={packConfig.targetCapacityWh ?? (packConfig.targetCapacityAh * packConfig.targetVoltage).toFixed(0)}
                onChange={(v) => updatePackConfig({ targetCapacityWh: v })}
                min={1} step={10} unit="Wh"
              />
            )}
          </Field>

          <Field label={t.maxDischargeCurrent}>
            <NumInput
              value={packConfig.maxDischargeCurrent}
              onChange={(v) => updatePackConfig({ maxDischargeCurrent: v })}
              min={1} step={5} unit="A"
            />
          </Field>
        </>
      )}

      {/* ── SP MODE: enter S, P, layers → compute capacity ── */}
      {calcMode === 'sp' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.manualSeries}>
              <NumInput
                value={spConfig.manualS}
                onChange={(v) => updateSpConfig({ manualS: Math.max(1, Math.round(v || 1)) })}
                min={1} max={500} step={1}
              />
            </Field>
            <Field label={t.manualParallel}>
              <NumInput
                value={spConfig.manualP}
                onChange={(v) => updateSpConfig({ manualP: Math.max(1, Math.round(v || 1)) })}
                min={1} max={500} step={1}
              />
            </Field>
          </div>

          {/* Derived results */}
          {electrical && (
            <div className="bg-panel-light rounded border border-accent/30 p-3 mt-1">
              <div className="text-xs text-accent font-semibold mb-2 font-mono">
                {electrical.S}S{electrical.P}P → {electrical.totalCells} {t.cells}
              </div>
              <ResultBadge label={t.derivedVoltage} value={electrical.packVoltage.toFixed(2)} unit="V" />
              <ResultBadge label={t.derivedCapacity} value={electrical.packCapacityAh.toFixed(2)} unit="Ah" />
              <ResultBadge label={t.derivedEnergy} value={electrical.energyWh.toFixed(1)} unit="Wh" />
            </div>
          )}
        </>
      )}

      {/* Size constraints (both modes) */}
      <SectionLabel>{t.sizeConstraints}</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t.maxL}>
          <NumInput value={packConfig.constraints.maxLength} onChange={(v) => updateConstraints({ maxLength: v })} min={1} unit="mm" />
        </Field>
        <Field label={t.maxW}>
          <NumInput value={packConfig.constraints.maxWidth} onChange={(v) => updateConstraints({ maxWidth: v })} min={1} unit="mm" />
        </Field>
        <Field label={t.maxH}>
          <NumInput value={packConfig.constraints.maxHeight} onChange={(v) => updateConstraints({ maxHeight: v })} min={1} unit="mm" />
        </Field>
      </div>

      {/* Alternatives (target mode only) */}
      {calcMode === 'target' && alternatives && alternatives.length > 0 && (
        <>
          <SectionLabel>{t.alternativeConfigs}</SectionLabel>
          <div className="space-y-1">
            {alternatives.map((alt, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-xs ${
                  alt.S === electrical?.S && alt.P === electrical?.P
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-panel-light'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-semibold text-accent">{alt.label}</span>
                  <span className="text-text-dim">{alt.totalCells} {t.cells}</span>
                </div>
                <div className="flex justify-between text-text-dim mt-0.5">
                  <span>{alt.packVoltage.toFixed(1)}V</span>
                  <span>{alt.packCapacityAh.toFixed(1)}Ah</span>
                  <span>{alt.energyWh.toFixed(0)}Wh</span>
                  <span>{alt.totalWeightKg.toFixed(2)}kg</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      </>}
    </div>
  );
}
