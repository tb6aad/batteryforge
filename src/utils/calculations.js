/**
 * BatteryForge Calculation Engine
 * All battery pack design calculations
 */

export const CYLINDRICAL_PRESETS = {
  '18650': { diameter: 18.5, height: 65.2 },
  '21700': { diameter: 21.2, height: 70.2 },
  '26650': { diameter: 26.5, height: 65.2 },
  '32700': { diameter: 32.5, height: 70.0 },
  '4680':  { diameter: 46.0, height: 80.0 },
};

export const PRELOADED_CELLS = [
  {
    id: 'samsung-50s',
    name: 'Samsung 50S',
    format: 'cylindrical',
    size: '21700',
    diameter: 21.2,
    height: 70.2,
    nominalVoltage: 3.6,
    capacityMah: 5000,
    maxDischargeCurrent: 25,
    internalResistance: 16,
    weight: 68.5,
  },
  {
    id: 'molicel-p45b',
    name: 'Molicel P45B',
    format: 'cylindrical',
    size: '21700',
    diameter: 21.2,
    height: 70.2,
    nominalVoltage: 3.6,
    capacityMah: 4500,
    maxDischargeCurrent: 45,
    internalResistance: 14,
    weight: 67.5,
  },
  {
    id: 'sony-vtc6',
    name: 'Sony VTC6',
    format: 'cylindrical',
    size: '18650',
    diameter: 18.5,
    height: 65.2,
    nominalVoltage: 3.6,
    capacityMah: 3000,
    maxDischargeCurrent: 30,
    internalResistance: 12,
    weight: 46.5,
  },
  {
    id: 'orion-ifr32700',
    name: 'Orion IFR32700',
    format: 'cylindrical',
    size: '32700',
    diameter: 32.0,
    height: 70.0,
    nominalVoltage: 3.2,
    capacityMah: 6000,
    maxDischargeCurrent: 18,
    internalResistance: 18,
    weight: 90,
  },
  {
    id: 'aspilsan-a28',
    name: 'Aspilsan A28 (Yerli)',
    format: 'cylindrical',
    size: '18650',
    diameter: 18.5,
    height: 65.2,
    nominalVoltage: 3.7,
    capacityMah: 2800,
    maxDischargeCurrent: 25,
    internalResistance: 20,
    weight: 46,
  },
];

/**
 * Calculate series and parallel configuration
 */
export function calculateSP(targetVoltage, targetCapacityAh, cellNominalVoltage, cellCapacityAh) {
  const S = Math.ceil(targetVoltage / cellNominalVoltage);
  const P = Math.ceil(targetCapacityAh / cellCapacityAh);
  return { S, P };
}

/**
 * Reverse: given S, P directly → derive capacity & voltage
 * Returns the same shape as calculatePackElectrical
 */
export function calculatePackFromSP(S, P, cell) {
  return calculatePackElectrical(S, P, cell);
}

/**
 * Calculate full pack electrical specs
 */
export function calculatePackElectrical(S, P, cell) {
  const totalCells = S * P;
  const packVoltage = S * cell.nominalVoltage;
  const packCapacityAh = P * (cell.capacityMah / 1000);
  const energyWh = packVoltage * packCapacityAh;
  const maxDischargeCurrent = P * cell.maxDischargeCurrent;
  const cRate = maxDischargeCurrent / packCapacityAh;
  const totalWeightG = totalCells * cell.weight;
  const energyDensityWhKg = energyWh / (totalWeightG / 1000);
  const packInternalResistanceMohm = (S * cell.internalResistance) / P;

  return {
    S,
    P,
    totalCells,
    packVoltage,
    packCapacityAh,
    energyWh,
    maxDischargeCurrent,
    cRate,
    totalWeightG,
    totalWeightKg: totalWeightG / 1000,
    energyDensityWhKg,
    packInternalResistanceMohm,
  };
}

/**
 * Calculate physical dimensions for cylindrical cells
 */
export function calculateCylindricalDimensions(S, P, cell, layers, bracketThickness, cellGap, orientation, layerGap = 0) {
  const isHorizontal = orientation === 'horizontal';

  let perLayerP = Math.ceil(P / layers);

  // For horizontal: cells lie on their side
  // depth = along cell axis = cellHeight, cross-section = diameter
  let layerWidth, layerDepth, layerHeight;

  if (!isHorizontal) {
    // Vertical: cells stand upright
    // width = P cells side by side
    // depth = S cells front to back
    // height = cellHeight
    layerWidth = perLayerP * cell.diameter + (perLayerP - 1) * cellGap;
    layerDepth = S * cell.diameter + (S - 1) * cellGap;
    layerHeight = cell.height;
  } else {
    // Horizontal: cells laid on side
    layerWidth = perLayerP * cell.height + (perLayerP - 1) * cellGap;
    layerDepth = S * cell.diameter + (S - 1) * cellGap;
    layerHeight = cell.diameter;
  }

  const gap = layerGap > 0 ? layerGap : bracketThickness;
  const totalHeight = layers * layerHeight + (layers - 1) * gap;

  const wall = Math.max(2.2, Math.min(cell.diameter * 0.055, 5.5));
  const withBracketWidth = layerWidth + wall * 2;
  const withBracketDepth = layerDepth + wall * 2;
  const withBracketHeight = totalHeight + wall * 2;

  const volumeL = (withBracketWidth * withBracketDepth * withBracketHeight) / 1e6;
  const cellVolume = Math.PI * Math.pow(cell.diameter / 2, 2) * cell.height;
  const totalCellVolume = S * P * cellVolume;
  const packVolume = withBracketWidth * withBracketDepth * withBracketHeight;
  const fillRatio = (totalCellVolume / packVolume) * 100;

  return {
    layerWidth,
    layerDepth,
    layerHeight,
    perLayerP,
    totalHeight,
    withBracket: {
      width: withBracketWidth,
      depth: withBracketDepth,
      height: withBracketHeight,
    },
    withoutBracket: {
      width: layerWidth,
      depth: layerDepth,
      height: totalHeight,
    },
    volumeL,
    fillRatio: Math.min(fillRatio, 100),
  };
}

/**
 * Calculate physical dimensions for prismatic/pouch cells
 */
export function calculatePrismaticDimensions(S, P, cell, layers, bracketThickness, cellGap, layerGap = 0) {
  const perLayerP = Math.ceil(P / layers);

  const layerWidth = perLayerP * cell.width + (perLayerP - 1) * cellGap;
  const layerDepth = S * cell.length + (S - 1) * cellGap;
  const layerHeight = cell.thickness;

  const gap = layerGap > 0 ? layerGap : bracketThickness;
  const totalHeight = layers * layerHeight + (layers - 1) * gap;

  const withBracketWidth = layerWidth + bracketThickness * 2;
  const withBracketDepth = layerDepth + bracketThickness * 2;
  const withBracketHeight = totalHeight + bracketThickness * 2;

  const volumeL = (withBracketWidth * withBracketDepth * withBracketHeight) / 1e6;
  const cellVolume = cell.length * cell.width * cell.thickness;
  const totalCellVolume = S * P * cellVolume;
  const packVolume = withBracketWidth * withBracketDepth * withBracketHeight;
  const fillRatio = (totalCellVolume / packVolume) * 100;

  return {
    layerWidth,
    layerDepth,
    layerHeight,
    perLayerP,
    totalHeight,
    withBracket: { width: withBracketWidth, depth: withBracketDepth, height: withBracketHeight },
    withoutBracket: { width: layerWidth, depth: layerDepth, height: totalHeight },
    volumeL,
    fillRatio: Math.min(fillRatio, 100),
  };
}

/**
 * Generate 3 alternative configurations
 */
export function generateAlternatives(targetVoltage, targetCapacityAh, cell) {
  const { S, P } = calculateSP(targetVoltage, targetCapacityAh, cell.nominalVoltage, cell.capacityMah / 1000);
  const alternatives = [];

  const configs = [
    { S: S - 1, P: Math.ceil(targetCapacityAh / (cell.capacityMah / 1000)) + 1 },
    { S, P },
    { S: S + 1, P: Math.max(1, P - 1) },
  ];

  for (const cfg of configs) {
    if (cfg.S > 0 && cfg.P > 0) {
      const elec = calculatePackElectrical(cfg.S, cfg.P, cell);
      alternatives.push({
        label: `${cfg.S}S${cfg.P}P`,
        ...elec,
        voltageDeviation: Math.abs(elec.packVoltage - targetVoltage),
        capacityDeviation: Math.abs(elec.packCapacityAh - targetCapacityAh),
      });
    }
  }

  return alternatives;
}

/**
 * Validate pack configuration and return warnings
 */
export function validatePack(electrical, dimensions, constraints, cell) {
  const warnings = [];

  if (electrical.maxDischargeCurrent > electrical.P * cell.maxDischargeCurrent) {
    warnings.push({
      type: 'danger',
      code: 'warnMaxCurrent',
      params: [electrical.maxDischargeCurrent.toFixed(0)],
    });
  }

  if (electrical.cRate > 2) {
    warnings.push({
      type: 'warning',
      code: 'warnCRate',
      params: [electrical.cRate.toFixed(2)],
    });
  }

  if (constraints && dimensions) {
    const dim = dimensions.withBracket;
    if (constraints.maxLength && dim.depth > constraints.maxLength) {
      warnings.push({
        type: 'danger',
        code: 'warnLargeDepth',
        params: [dim.depth.toFixed(0), constraints.maxLength],
      });
    }
    if (constraints.maxWidth && dim.width > constraints.maxWidth) {
      warnings.push({
        type: 'danger',
        code: 'warnLargeWidth',
        params: [dim.width.toFixed(0), constraints.maxWidth],
      });
    }
    if (constraints.maxHeight && dim.height > constraints.maxHeight) {
      warnings.push({
        type: 'danger',
        code: 'warnLargeHeight',
        params: [dim.height.toFixed(0), constraints.maxHeight],
      });
    }
  }

  if (electrical.totalCells > 200) {
    warnings.push({
      type: 'warning',
      code: 'warnLargePack',
      params: [electrical.totalCells],
    });
  }

  return warnings;
}

/**
 * BMS recommendation
 */
export function getBMSRecommendation(S, P, cell) {
  const balanceCurrent = Math.max(50, Math.round(cell.capacityMah * 0.01));
  return {
    strings: S,
    balanceCurrentMa: balanceCurrent,
    recommendation: `Requires ${S}S BMS, balance current ≥ ${balanceCurrent} mA, continuous discharge ≥ ${(P * cell.maxDischargeCurrent).toFixed(0)} A`,
  };
}

/**
 * Unit conversions
 */
export function mmToInch(mm) {
  return (mm / 25.4).toFixed(2);
}

export function inchToMm(inch) {
  return (inch * 25.4).toFixed(1);
}

export function ahToWh(ah, voltage) {
  return ah * voltage;
}

export function whToAh(wh, voltage) {
  return wh / voltage;
}
