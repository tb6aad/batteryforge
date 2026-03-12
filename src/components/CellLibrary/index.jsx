import React, { useState } from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { useT } from '../../i18n/translations';
import { CYLINDRICAL_PRESETS } from '../../utils/calculations';

const FORMATS = ['cylindrical', 'prismatic', 'pouch'];
const CYLINDRICAL_SIZES = Object.keys(CYLINDRICAL_PRESETS);

function CollapseHeader({ label, open, onToggle, badge }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-1.5 group"
    >
      <span className="text-xs font-semibold text-text-dim uppercase tracking-widest group-hover:text-text transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
            {badge}
          </span>
        )}
        <span className={`text-text-dim text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
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

function Field({ label, children, error }) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-text-dim mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function Input({ value, onChange, min, max, step, unit, ...props }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step || 0.1}
        className="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm text-text focus:border-accent focus:outline-none"
        {...props}
      />
      {unit && <span className="text-xs text-text-dim w-8">{unit}</span>}
    </div>
  );
}

export default function CellLibrary() {
  const { preloadedCells, customCells, selectedCell, selectCell, saveCustomCell, deleteCustomCell, language } =
    useBatteryStore();
  const t = useT(language);

  const [open, setOpen] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormat, setCustomFormat] = useState('cylindrical');
  const [cylindricalSize, setCylindricalSize] = useState('21700');
  const [customCell, setCustomCell] = useState({
    name: '',
    format: 'cylindrical',
    diameter: 21.2,
    height: 70.2,
    length: 60,
    width: 40,
    thickness: 10,
    nominalVoltage: 3.6,
    capacityMah: 4000,
    maxDischargeCurrent: 20,
    internalResistance: 15,
    weight: 60,
  });
  const [errors, setErrors] = useState({});

  const allCells = [...preloadedCells, ...customCells];

  function handleSizePreset(size) {
    setCylindricalSize(size);
    const preset = CYLINDRICAL_PRESETS[size];
    setCustomCell((c) => ({ ...c, ...preset, size }));
  }

  function handleFormatChange(fmt) {
    setCustomFormat(fmt);
    setCustomCell((c) => ({ ...c, format: fmt }));
  }

  function validateAndSave() {
    const errs = {};
    if (!customCell.name.trim()) errs.name = t.nameRequired;
    if (customCell.nominalVoltage <= 0) errs.nominalVoltage = t.mustBePositive;
    if (customCell.capacityMah <= 0) errs.capacityMah = t.mustBePositive;
    if (customCell.maxDischargeCurrent <= 0) errs.maxDischargeCurrent = t.mustBePositive;
    if (customCell.weight <= 0) errs.weight = t.mustBePositive;
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    saveCustomCell({ ...customCell, format: customFormat });
    setShowCustomForm(false);
  }

  const formatLabels = {
    cylindrical: t.cylindrical,
    prismatic: t.prismatic,
    pouch: t.pouch,
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Collapsible header */}
      <div className="border-b border-border pb-1">
        <CollapseHeader
          label={t.cellLibrary}
          open={open}
          onToggle={() => setOpen((v) => !v)}
          badge={selectedCell?.name}
        />
      </div>

      {!open && null}
      {open && <>

      {/* Cell selector list */}
      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
        {allCells.map((cell) => (
          <div
            key={cell.id}
            onClick={() => selectCell(cell)}
            className={`
              flex items-center justify-between p-2 rounded cursor-pointer border transition-all
              ${selectedCell?.id === cell.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-panel-light hover:border-accent/40 text-text'}
            `}
          >
            <div>
              <div className="text-sm font-medium">{cell.name}</div>
              <div className="text-xs text-text-dim">
                {cell.format === 'cylindrical'
                  ? cell.size || `${cell.diameter}×${cell.height}`
                  : `${cell.length}×${cell.width}×${cell.thickness}`}
                {' · '}{cell.nominalVoltage}V · {cell.capacityMah}mAh
              </div>
            </div>
            {customCells.find((c) => c.id === cell.id) && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteCustomCell(cell.id); }}
                className="text-xs text-danger hover:text-danger/80 ml-2"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Selected cell specs */}
      {selectedCell && (
        <div className="bg-panel-light rounded p-3 mt-2 border border-border text-xs space-y-1">
          <div className="text-accent font-semibold mb-2">{selectedCell.name} — {t.specs}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-text-dim">{t.nominalVoltage}</span>
            <span>{selectedCell.nominalVoltage} V</span>
            <span className="text-text-dim">{t.capacity}</span>
            <span>{selectedCell.capacityMah} mAh</span>
            <span className="text-text-dim">{t.maxDischarge}</span>
            <span>{selectedCell.maxDischargeCurrent} A</span>
            <span className="text-text-dim">{t.intResistance}</span>
            <span>{selectedCell.internalResistance} mΩ</span>
            <span className="text-text-dim">{t.weight}</span>
            <span>{selectedCell.weight} g</span>
            {selectedCell.format === 'cylindrical' && (
              <>
                <span className="text-text-dim">{t.diameter}</span>
                <span>{selectedCell.diameter} mm</span>
                <span className="text-text-dim">{t.height}</span>
                <span>{selectedCell.height} mm</span>
              </>
            )}
            {(selectedCell.format === 'prismatic' || selectedCell.format === 'pouch') && (
              <>
                <span className="text-text-dim">{t.lengthXwidthXthickness}</span>
                <span>{selectedCell.length}×{selectedCell.width}×{selectedCell.thickness} mm</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add custom cell */}
      <button
        onClick={() => setShowCustomForm((v) => !v)}
        className="mt-2 w-full py-1.5 text-xs border border-dashed border-accent/40 text-accent hover:bg-accent/10 rounded transition-colors"
      >
        {showCustomForm ? t.cancelCustomCell : t.addCustomCell}
      </button>

      {showCustomForm && (
        <div className="bg-panel-light border border-border rounded p-3 space-y-2 mt-1">
          <Field label={t.cellName} error={errors.name}>
            <input
              type="text"
              value={customCell.name}
              onChange={(e) => setCustomCell((c) => ({ ...c, name: e.target.value }))}
              placeholder={t.namePlaceholder}
              className="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text focus:border-accent focus:outline-none"
            />
          </Field>

          <Field label={t.cellFormat}>
            <div className="flex gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormatChange(f)}
                  className={`flex-1 text-xs py-1 rounded capitalize border transition-colors ${
                    customFormat === f
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-text-dim hover:border-accent/40'
                  }`}
                >
                  {formatLabels[f]}
                </button>
              ))}
            </div>
          </Field>

          {customFormat === 'cylindrical' && (
            <>
              <Field label={t.sizePreset}>
                <div className="flex flex-wrap gap-1">
                  {CYLINDRICAL_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSizePreset(s)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        cylindricalSize === s
                          ? 'border-accent bg-accent/20 text-accent'
                          : 'border-border text-text-dim hover:border-accent/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setCylindricalSize('custom')}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      cylindricalSize === 'custom'
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-border text-text-dim hover:border-accent/40'
                    }`}
                  >
                    {t.custom}
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={`${t.diameter} (mm)`}>
                  <Input value={customCell.diameter} onChange={(v) => setCustomCell((c) => ({ ...c, diameter: v }))} min={5} max={100} unit="mm" />
                </Field>
                <Field label={`${t.height} (mm)`}>
                  <Input value={customCell.height} onChange={(v) => setCustomCell((c) => ({ ...c, height: v }))} min={5} max={250} unit="mm" />
                </Field>
              </div>
            </>
          )}

          {(customFormat === 'prismatic' || customFormat === 'pouch') && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="L (mm)">
                <Input value={customCell.length} onChange={(v) => setCustomCell((c) => ({ ...c, length: v }))} min={1} unit="mm" />
              </Field>
              <Field label="G (mm)">
                <Input value={customCell.width} onChange={(v) => setCustomCell((c) => ({ ...c, width: v }))} min={1} unit="mm" />
              </Field>
              <Field label="K (mm)">
                <Input value={customCell.thickness} onChange={(v) => setCustomCell((c) => ({ ...c, thickness: v }))} min={1} unit="mm" />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label={`${t.voltage} (V)`} error={errors.nominalVoltage}>
              <Input value={customCell.nominalVoltage} onChange={(v) => setCustomCell((c) => ({ ...c, nominalVoltage: v }))} min={1} max={5} step={0.1} unit="V" />
            </Field>
            <Field label={`${t.capacity} (mAh)`} error={errors.capacityMah}>
              <Input value={customCell.capacityMah} onChange={(v) => setCustomCell((c) => ({ ...c, capacityMah: v }))} min={100} step={100} unit="mAh" />
            </Field>
            <Field label={`${t.maxCurrent} (A)`} error={errors.maxDischargeCurrent}>
              <Input value={customCell.maxDischargeCurrent} onChange={(v) => setCustomCell((c) => ({ ...c, maxDischargeCurrent: v }))} min={1} unit="A" />
            </Field>
            <Field label={`${t.intResistance} (mΩ)`}>
              <Input value={customCell.internalResistance} onChange={(v) => setCustomCell((c) => ({ ...c, internalResistance: v }))} min={0} unit="mΩ" />
            </Field>
            <Field label={`${t.weight} (g)`} error={errors.weight}>
              <Input value={customCell.weight} onChange={(v) => setCustomCell((c) => ({ ...c, weight: v }))} min={1} unit="g" />
            </Field>
          </div>

          <button
            onClick={validateAndSave}
            className="w-full py-1.5 text-sm bg-accent text-bg font-semibold rounded hover:bg-accent-dim transition-colors"
          >
            {t.saveCustomCell}
          </button>
        </div>
      )}

      </>}
    </div>
  );
}
