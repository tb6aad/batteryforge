import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PRELOADED_CELLS,
  calculateSP,
  calculatePackElectrical,
  calculateCylindricalDimensions,
  calculatePrismaticDimensions,
  generateAlternatives,
  validatePack,
  getBMSRecommendation,
} from '../utils/calculations';

const DEFAULT_CELL = PRELOADED_CELLS[0]; // Samsung 50S

const DEFAULT_PACK_CONFIG = {
  targetVoltage: 48,
  targetCapacityAh: 20,
  targetCapacityWh: null,
  capacityUnit: 'Ah', // 'Ah' | 'Wh'
  maxDischargeCurrent: 60,
  constraints: {
    maxLength: null,
    maxWidth: null,
    maxHeight: null,
  },
};

// Reverse mode: user enters S, P directly
const DEFAULT_SP_CONFIG = {
  manualS: 14,
  manualP: 4,
};

const DEFAULT_LAYER_CONFIG = {
  layers: 2,
  bracketThickness: 9,
  cellGap: 4,
  layerGap: 4,
  orientation: 'vertical', // 'vertical' | 'horizontal'
};

const DEFAULT_VISUALIZER = {
  showBrackets: true,
  showLabels: false,
  explodedView: false,
  crossSection: false,
};

function computeResults(cell, packConfig, layerConfig, calcMode, spConfig) {
  let S, P;

  if (calcMode === 'sp') {
    S = Math.max(1, Math.round(spConfig.manualS));
    P = Math.max(1, Math.round(spConfig.manualP));
  } else {
    const targetCapacityAh =
      packConfig.capacityUnit === 'Wh'
        ? (packConfig.targetCapacityWh ?? 0) / (packConfig.targetVoltage || 1)
        : packConfig.targetCapacityAh;

    const result = calculateSP(
      packConfig.targetVoltage,
      targetCapacityAh,
      cell.nominalVoltage,
      cell.capacityMah / 1000
    );
    S = result.S;
    P = result.P;
  }

  const electrical = calculatePackElectrical(S, P, cell);

  let dimensions = null;
  if (cell.format === 'cylindrical') {
    dimensions = calculateCylindricalDimensions(
      S, P, cell,
      layerConfig.layers,
      layerConfig.bracketThickness,
      layerConfig.cellGap,
      layerConfig.orientation,
      layerConfig.layerGap ?? 0
    );
  } else {
    dimensions = calculatePrismaticDimensions(
      S, P, cell,
      layerConfig.layers,
      layerConfig.bracketThickness,
      layerConfig.cellGap,
      layerConfig.layerGap ?? 0
    );
  }

  const targetVoltageForAlt = calcMode === 'sp'
    ? electrical.packVoltage
    : packConfig.targetVoltage;
  const targetCapacityForAlt = calcMode === 'sp'
    ? electrical.packCapacityAh
    : (packConfig.capacityUnit === 'Wh'
        ? (packConfig.targetCapacityWh ?? 0) / (packConfig.targetVoltage || 1)
        : packConfig.targetCapacityAh);

  const alternatives = generateAlternatives(targetVoltageForAlt, targetCapacityForAlt, cell);
  const warnings = validatePack(electrical, dimensions, packConfig.constraints, cell);
  const bms = getBMSRecommendation(S, P, cell);

  return { electrical, dimensions, alternatives, warnings, bms };
}

export const useBatteryStore = create(
  persist(
    (set, get) => ({
      // ── Cell library ──────────────────────────────────
      preloadedCells: PRELOADED_CELLS,
      customCells: [],
      selectedCell: DEFAULT_CELL,

      // ── Calc mode ─────────────────────────────────────
      calcMode: 'target', // 'target' | 'sp'

      // ── Pack configuration ────────────────────────────
      packConfig: DEFAULT_PACK_CONFIG,

      // ── Manual S/P config (reverse mode) ─────────────
      spConfig: DEFAULT_SP_CONFIG,

      // ── Layer configuration ───────────────────────────
      layerConfig: DEFAULT_LAYER_CONFIG,

      // ── Visualizer settings ───────────────────────────
      visualizer: DEFAULT_VISUALIZER,

      // ── Computed results ──────────────────────────────
      results: computeResults(DEFAULT_CELL, DEFAULT_PACK_CONFIG, DEFAULT_LAYER_CONFIG, 'target', DEFAULT_SP_CONFIG),

      // ── Unit toggle ───────────────────────────────────
      unitSystem: 'mm', // 'mm' | 'inch'

      // ── Language ──────────────────────────────────────
      language: 'tr', // 'en' | 'tr'

      // ── Recalculate helper ────────────────────────────
      _recalculate() {
        const { selectedCell, packConfig, layerConfig, calcMode, spConfig } = get();
        const results = computeResults(selectedCell, packConfig, layerConfig, calcMode, spConfig);
        set({ results });
      },

      // ── Actions ───────────────────────────────────────
      selectCell(cell) {
        set({ selectedCell: cell });
        get()._recalculate();
      },

      saveCustomCell(cell) {
        const id = `custom-${Date.now()}`;
        const newCell = { ...cell, id };
        set((s) => ({ customCells: [...s.customCells, newCell] }));
      },

      deleteCustomCell(id) {
        set((s) => ({ customCells: s.customCells.filter((c) => c.id !== id) }));
      },

      setCalcMode(mode) {
        set({ calcMode: mode });
        // When switching to sp mode, seed manualS/P from current result
        if (mode === 'sp') {
          const { results } = get();
          if (results?.electrical) {
            set((s) => ({
              spConfig: {
                ...s.spConfig,
                manualS: results.electrical.S,
                manualP: results.electrical.P,
              },
            }));
          }
        }
        get()._recalculate();
      },

      updateSpConfig(partial) {
        set((s) => ({ spConfig: { ...s.spConfig, ...partial } }));
        get()._recalculate();
      },

      updatePackConfig(partial) {
        set((s) => ({ packConfig: { ...s.packConfig, ...partial } }));
        get()._recalculate();
      },

      updateConstraints(partial) {
        set((s) => ({
          packConfig: {
            ...s.packConfig,
            constraints: { ...s.packConfig.constraints, ...partial },
          },
        }));
        get()._recalculate();
      },

      updateLayerConfig(partial) {
        set((s) => {
          const next = { ...s.layerConfig, ...partial };
          // When bracket is enabled, auto-increase cellGap to minimum 4mm
          if ('bracketThickness' in partial && partial.bracketThickness > 0 && next.cellGap < 4) {
            next.cellGap = 4;
          }
          return { layerConfig: next };
        });
        get()._recalculate();
      },

      updateVisualizer(partial) {
        set((s) => ({ visualizer: { ...s.visualizer, ...partial } }));
      },

      setUnitSystem(system) {
        set({ unitSystem: system });
      },

      setLanguage(lang) {
        set({ language: lang });
      },

      resetPack() {
        set({
          selectedCell: DEFAULT_CELL,
          packConfig: DEFAULT_PACK_CONFIG,
          spConfig: DEFAULT_SP_CONFIG,
          calcMode: 'target',
          layerConfig: DEFAULT_LAYER_CONFIG,
          visualizer: DEFAULT_VISUALIZER,
          results: computeResults(DEFAULT_CELL, DEFAULT_PACK_CONFIG, DEFAULT_LAYER_CONFIG, 'target', DEFAULT_SP_CONFIG),
        });
      },

      getAllCells() {
        const { preloadedCells, customCells } = get();
        return [...preloadedCells, ...customCells];
      },
    }),
    {
      name: 'batteryforge-state',
      partialize: (s) => ({
        customCells: s.customCells,
        unitSystem: s.unitSystem,
        language: s.language,
        calcMode: s.calcMode,
        packConfig: s.packConfig,
        spConfig: s.spConfig,
        layerConfig: s.layerConfig,
      }),
    }
  )
);
