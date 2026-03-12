export const translations = {
  en: {
    // Toolbar
    appName: 'BatteryForge',
    newPack: 'New Pack',
    exportPDF: 'Export PDF',
    exportCSV: 'Export CSV',

    // Cell Library
    cellLibrary: 'Cell Library',
    cellName: 'Cell Name',
    cellFormat: 'Format',
    sizePreset: 'Size Preset',
    diameter: 'Diameter',
    height: 'Height',
    voltage: 'Voltage',
    capacity: 'Capacity',
    maxCurrent: 'Max Current',
    intResistance: 'Int. Resistance',
    weight: 'Weight',
    addCustomCell: '+ Add Custom Cell',
    cancelCustomCell: '— Cancel',
    saveCustomCell: 'Save Custom Cell',
    specs: 'Specs',
    nominalVoltage: 'Voltage',
    maxDischarge: 'Max Discharge',
    lengthXwidthXthickness: 'L×W×T',
    cylindrical: 'Cylindrical',
    prismatic: 'Prismatic',
    pouch: 'Pouch',
    custom: 'Custom',
    namePlaceholder: 'e.g. LG M50LT',
    nameRequired: 'Name required',
    mustBePositive: 'Must be > 0',

    // Pack Calculator
    packCalculator: 'Pack Calculator',
    modeTarget: 'Target → S×P',
    modeSP: 'S×P → Capacity',
    targetVoltage: 'Target Voltage',
    targetCapacity: 'Target Capacity',
    maxDischargeCurrent: 'Max Discharge Current',
    sizeConstraints: 'Size Constraints (optional)',
    maxL: 'Max L',
    maxW: 'Max W',
    maxH: 'Max H',
    alternativeConfigs: 'Alternative Configurations',
    cells: 'cells',
    groups: 'groups',
    series: 'Series',
    parallel: 'Parallel',
    manualSeries: 'Series Groups (S)',
    manualParallel: 'Parallel Groups (P)',
    derivedVoltage: 'Resulting Voltage',
    derivedCapacity: 'Resulting Capacity',
    derivedEnergy: 'Resulting Energy',

    // Layer Designer
    layerDesigner: 'Layer Designer',
    layers: 'Layers (1–6)',
    bracketThickness: 'Bracket Thickness',
    cellGap: 'Cell Gap',
    orientation: 'Cell Orientation',
    vertical: 'Vertical',
    horizontal: 'Horizontal',
    perLayer: 'per layer',
    calculatedDimensions: 'Calculated Dimensions',
    perLayerLabel: 'Per Layer',
    withoutBracket: 'Without Bracket',
    withBracket: 'With Bracket',
    volume: 'Volume',
    fillRatio: 'Fill Ratio',
    width: 'Width',
    depth: 'Depth',

    // Results Panel
    results: 'Results',
    packConfiguration: 'Pack Configuration',
    totalCells: 'Total Cells',
    electrical: 'Electrical',
    packVoltage: 'Voltage',
    packCapacity: 'Capacity',
    energy: 'Energy',
    packResistance: 'Pack Resistance',
    physical: 'Physical',
    performance: 'Performance',
    maxDischargeLabel: 'Max Discharge',
    cRate: 'C-Rate',
    energyDensity: 'Energy Density',
    volEnergyDensity: 'Vol. Energy Density',
    bmsRecommendation: 'BMS Recommendation',
    strings: 'Strings',
    balance: 'Balance',
    warnings: 'Warnings',
    status: 'Status',
    allChecksPassed: 'All checks passed. Pack configuration is valid.',
    noConfig: 'No configuration loaded',

    // BMS template
    bmsTemplate: (S, P, cell, current) =>
      `Requires ${S}S BMS, balance current ≥ ${Math.max(50, Math.round(cell.capacityMah * 0.01))} mA, continuous discharge ≥ ${current} A`,

    // Warnings
    warnMaxCurrent: (actual, limit) =>
      `Max current ${actual}A exceeds cell limit`,
    warnCRate: (rate) =>
      `C-rate ${rate}C exceeds 2C — consider more parallel groups`,
    warnLargeDepth: (actual, max) =>
      `Pack depth ${actual}mm exceeds max length ${max}mm`,
    warnLargeWidth: (actual, max) =>
      `Pack width ${actual}mm exceeds max width ${max}mm`,
    warnLargeHeight: (actual, max) =>
      `Pack height ${actual}mm exceeds max height ${max}mm`,
    warnLargePack: (count) =>
      `Large pack: ${count} cells — verify thermal management`,

    // Visualizer
    brackets: 'Brackets',
    labels: 'Labels',
    exploded: 'Exploded',
    crossSection: 'Cross Section',
    configurePack: 'Configure pack to see 3D visualization',
  },

  tr: {
    // Toolbar
    appName: 'BatteryForge',
    newPack: 'Yeni Paket',
    exportPDF: 'PDF Dışa Aktar',
    exportCSV: 'CSV Dışa Aktar',

    // Cell Library
    cellLibrary: 'Hücre Kütüphanesi',
    cellName: 'Hücre Adı',
    cellFormat: 'Format',
    sizePreset: 'Boyut Ön Ayarı',
    diameter: 'Çap',
    height: 'Yükseklik',
    voltage: 'Gerilim',
    capacity: 'Kapasite',
    maxCurrent: 'Maks. Akım',
    intResistance: 'İç Direnç',
    weight: 'Ağırlık',
    addCustomCell: '+ Özel Hücre Ekle',
    cancelCustomCell: '— İptal',
    saveCustomCell: 'Özel Hücreyi Kaydet',
    specs: 'Özellikler',
    nominalVoltage: 'Gerilim',
    maxDischarge: 'Maks. Deşarj',
    lengthXwidthXthickness: 'U×G×K',
    cylindrical: 'Silindirik',
    prismatic: 'Prizmatik',
    pouch: 'Pouch',
    custom: 'Özel',
    namePlaceholder: 'örn. LG M50LT',
    nameRequired: 'Ad gerekli',
    mustBePositive: '0\'dan büyük olmalı',

    // Pack Calculator
    packCalculator: 'Paket Hesaplayıcı',
    modeTarget: 'Hedef → S×P',
    modeSP: 'S×P → Kapasite',
    targetVoltage: 'Hedef Gerilim',
    targetCapacity: 'Hedef Kapasite',
    maxDischargeCurrent: 'Maks. Deşarj Akımı',
    sizeConstraints: 'Boyut Kısıtlamaları (isteğe bağlı)',
    maxL: 'Maks. U',
    maxW: 'Maks. G',
    maxH: 'Maks. Y',
    alternativeConfigs: 'Alternatif Konfigürasyonlar',
    cells: 'hücre',
    groups: 'grup',
    series: 'Seri',
    parallel: 'Paralel',
    manualSeries: 'Seri Grup Sayısı (S)',
    manualParallel: 'Paralel Grup Sayısı (P)',
    derivedVoltage: 'Elde Edilen Gerilim',
    derivedCapacity: 'Elde Edilen Kapasite',
    derivedEnergy: 'Elde Edilen Enerji',

    // Layer Designer
    layerDesigner: 'Katman Tasarımcısı',
    layers: 'Katman Sayısı (1–6)',
    bracketThickness: 'Braket Kalınlığı',
    cellGap: 'Hücre Aralığı',
    orientation: 'Hücre Yönü',
    vertical: 'Dikey',
    horizontal: 'Yatay',
    perLayer: 'katman başına',
    calculatedDimensions: 'Hesaplanan Boyutlar',
    perLayerLabel: 'Katman Başına',
    withoutBracket: 'Braketsiz',
    withBracket: 'Braketli',
    volume: 'Hacim',
    fillRatio: 'Doluluk Oranı',
    width: 'Genişlik',
    depth: 'Derinlik',

    // Results Panel
    results: 'Sonuçlar',
    packConfiguration: 'Paket Konfigürasyonu',
    totalCells: 'Toplam Hücre',
    electrical: 'Elektriksel',
    packVoltage: 'Gerilim',
    packCapacity: 'Kapasite',
    energy: 'Enerji',
    packResistance: 'Paket Direnci',
    physical: 'Fiziksel',
    performance: 'Performans',
    maxDischargeLabel: 'Maks. Deşarj',
    cRate: 'C-Oranı',
    energyDensity: 'Enerji Yoğunluğu',
    volEnergyDensity: 'Hacimsel Enerji Yoğunluğu',
    bmsRecommendation: 'BMS Önerisi',
    strings: 'Dizi',
    balance: 'Balans',
    warnings: 'Uyarılar',
    status: 'Durum',
    allChecksPassed: 'Tüm kontroller geçti. Paket konfigürasyonu geçerli.',
    noConfig: 'Yüklü konfigürasyon yok',

    // BMS template
    bmsTemplate: (S, P, cell, current) =>
      `${S}S BMS gerektirir, balans akımı ≥ ${Math.max(50, Math.round(cell.capacityMah * 0.01))} mA, sürekli deşarj ≥ ${current} A`,

    // Warnings
    warnMaxCurrent: (actual) =>
      `Maks. akım ${actual}A hücre limitini aşıyor`,
    warnCRate: (rate) =>
      `C-oranı ${rate}C, 2C'yi aşıyor — daha fazla paralel grup ekleyin`,
    warnLargeDepth: (actual, max) =>
      `Paket derinliği ${actual}mm, maks. uzunluk ${max}mm'yi aşıyor`,
    warnLargeWidth: (actual, max) =>
      `Paket genişliği ${actual}mm, maks. genişlik ${max}mm'yi aşıyor`,
    warnLargeHeight: (actual, max) =>
      `Paket yüksekliği ${actual}mm, maks. yükseklik ${max}mm'yi aşıyor`,
    warnLargePack: (count) =>
      `Büyük paket: ${count} hücre — termal yönetimi doğrulayın`,

    // Visualizer
    brackets: 'Braket',
    labels: 'Etiketler',
    exploded: 'Patlama',
    crossSection: 'Kesit',
    configurePack: '3D görselleştirme için paketi yapılandırın',
  },
};

export function useT(lang) {
  return translations[lang] ?? translations.en;
}
