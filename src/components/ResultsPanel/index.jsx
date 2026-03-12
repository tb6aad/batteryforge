import React from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { useT } from '../../i18n/translations';
import { mmToInch } from '../../utils/calculations';

function Card({ icon, title, children, accent }) {
  return (
    <div className={`bg-panel-light rounded-lg border p-3 ${accent ? 'border-accent/40' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, unit, highlight }) {
  return (
    <div className="flex justify-between items-baseline py-0.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-text-dim">{label}</span>
      <span className={`text-sm font-mono ${highlight ? 'text-accent font-semibold' : 'text-text'}`}>
        {value}{unit && <span className="text-xs text-text-dim ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function WarningBadge({ type, message }) {
  const styles = {
    danger: 'bg-danger/15 border-danger/40 text-danger',
    warning: 'bg-warning/15 border-warning/40 text-warning',
    info: 'bg-accent/15 border-accent/40 text-accent',
  };
  const icons = { danger: '⚠', warning: '⚡', info: 'ℹ' };

  return (
    <div className={`text-xs rounded border px-2 py-1.5 flex gap-2 items-start ${styles[type] || styles.info}`}>
      <span className="shrink-0">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

export default function ResultsPanel() {
  const { results, unitSystem, language } = useBatteryStore();
  const t = useT(language);
  const { electrical, dimensions, warnings, bms } = results;

  if (!electrical) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim text-sm">
        {t.noConfig}
      </div>
    );
  }

  function fmt(mm) {
    if (mm == null) return '—';
    return unitSystem === 'mm' ? `${mm.toFixed(1)} mm` : `${mmToInch(mm)} in`;
  }

  const dim = dimensions?.withBracket;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1">

      {/* Configuration */}
      <Card icon="✅" title={t.packConfiguration} accent>
        <DataRow label={language === 'tr' ? 'Konfig.' : 'Config'} value={`${electrical.S}S${electrical.P}P`} highlight />
        <DataRow label={t.totalCells} value={electrical.totalCells} />
        <DataRow label={t.series} value={electrical.S} unit={t.groups} />
        <DataRow label={t.parallel} value={electrical.P} unit={t.groups} />
      </Card>

      {/* Electrical */}
      <Card icon="⚡" title={t.electrical}>
        <DataRow label={t.packVoltage} value={electrical.packVoltage.toFixed(2)} unit="V" highlight />
        <DataRow label={t.packCapacity} value={electrical.packCapacityAh.toFixed(2)} unit="Ah" />
        <DataRow label={t.energy} value={electrical.energyWh.toFixed(1)} unit="Wh" />
        <DataRow label={t.packResistance} value={electrical.packInternalResistanceMohm.toFixed(1)} unit="mΩ" />
      </Card>

      {/* Physical */}
      <Card icon="⚖️" title={t.physical}>
        {dim && (
          <>
            <DataRow label={t.width} value={fmt(dim.width)} />
            <DataRow label={t.depth} value={fmt(dim.depth)} />
            <DataRow label={t.height} value={fmt(dim.height)} />
          </>
        )}
        {dimensions && (
          <DataRow label={t.volume} value={dimensions.volumeL.toFixed(3)} unit="L" />
        )}
        <DataRow label={t.weight} value={electrical.totalWeightKg.toFixed(3)} unit="kg" highlight />
      </Card>

      {/* Performance */}
      <Card icon="🔋" title={t.performance}>
        <DataRow label={t.maxDischargeLabel} value={electrical.maxDischargeCurrent.toFixed(0)} unit="A" highlight />
        <DataRow label={t.cRate} value={electrical.cRate.toFixed(2)} unit="C" />
        <DataRow label={t.energyDensity} value={electrical.energyDensityWhKg.toFixed(1)} unit="Wh/kg" />
        {dimensions && (
          <DataRow
            label={t.volEnergyDensity}
            value={(electrical.energyWh / dimensions.volumeL).toFixed(1)}
            unit="Wh/L"
          />
        )}
      </Card>

      {/* BMS */}
      {bms && (
        <Card icon="🔌" title={t.bmsRecommendation}>
          <div className="text-xs text-text leading-relaxed">{bms.recommendation}</div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
            <DataRow label={t.strings} value={bms.strings} />
            <DataRow label={t.balance} value={`≥ ${bms.balanceCurrentMa}`} unit="mA" />
          </div>
        </Card>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Card icon="⚠️" title={t.warnings}>
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <WarningBadge key={i} type={w.type} message={
                w.code && t[w.code] ? t[w.code](...(w.params || [])) : w.message
              } />
            ))}
          </div>
        </Card>
      )}

      {warnings && warnings.length === 0 && (
        <Card icon="✅" title={t.status}>
          <div className="text-xs text-success">{t.allChecksPassed}</div>
        </Card>
      )}
    </div>
  );
}
