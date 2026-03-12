import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportPDF(store, canvasRef) {
  const { selectedCell, results, layerConfig, packConfig } = store;
  const { electrical, dimensions, bms, warnings } = results;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;

  // Header
  doc.setFillColor(15, 17, 23);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setFontSize(20);
  doc.setTextColor(0, 212, 255);
  doc.text('BatteryForge', margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(136, 146, 164);
  doc.text('Battery Pack Design Report', margin, 25);
  doc.setTextColor(136, 146, 164);
  doc.text(new Date().toLocaleDateString(), pageW - margin, 25, { align: 'right' });

  let y = 40;

  // Pack Summary
  doc.setFontSize(12);
  doc.setTextColor(0, 212, 255);
  doc.text('Pack Configuration', margin, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Parameter', 'Value']],
    body: [
      ['Configuration', `${electrical.S}S${electrical.P}P`],
      ['Total Cells', `${electrical.totalCells}`],
      ['Cell', selectedCell?.name || 'Custom'],
      ['Pack Voltage', `${electrical.packVoltage.toFixed(2)} V`],
      ['Pack Capacity', `${electrical.packCapacityAh.toFixed(2)} Ah`],
      ['Energy', `${electrical.energyWh.toFixed(1)} Wh`],
      ['Max Discharge Current', `${electrical.maxDischargeCurrent.toFixed(0)} A`],
      ['C-Rate', `${electrical.cRate.toFixed(2)} C`],
      ['Total Weight', `${electrical.totalWeightKg.toFixed(3)} kg`],
      ['Energy Density', `${electrical.energyDensityWhKg.toFixed(1)} Wh/kg`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [26, 29, 46], textColor: [0, 212, 255] },
    styles: { fontSize: 9, textColor: [226, 232, 240] },
    alternateRowStyles: { fillColor: [22, 25, 40] },
    tableLineColor: [42, 45, 64],
    tableLineWidth: 0.1,
  });

  y = doc.lastAutoTable.finalY + 10;

  // Physical Dimensions
  if (dimensions) {
    doc.setFontSize(12);
    doc.setTextColor(0, 212, 255);
    doc.text('Physical Dimensions', margin, y);
    y += 6;

    const dim = dimensions.withBracket;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Dimension', 'With Bracket', 'Without Bracket']],
      body: [
        ['Width', `${dim.width.toFixed(1)} mm`, `${dimensions.withoutBracket.width.toFixed(1)} mm`],
        ['Depth', `${dim.depth.toFixed(1)} mm`, `${dimensions.withoutBracket.depth.toFixed(1)} mm`],
        ['Height', `${dim.height.toFixed(1)} mm`, `${dimensions.withoutBracket.height.toFixed(1)} mm`],
        ['Volume', `${dimensions.volumeL.toFixed(3)} L`, '—'],
        ['Fill Ratio', `${dimensions.fillRatio.toFixed(1)} %`, '—'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [26, 29, 46], textColor: [0, 212, 255] },
      styles: { fontSize: 9, textColor: [226, 232, 240] },
      alternateRowStyles: { fillColor: [22, 25, 40] },
      tableLineColor: [42, 45, 64],
      tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // BMS
  if (bms) {
    doc.setFontSize(12);
    doc.setTextColor(0, 212, 255);
    doc.text('BMS Recommendation', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    doc.text(bms.recommendation, margin, y, { maxWidth: pageW - margin * 2 });
    y += 12;
  }

  // Warnings
  if (warnings && warnings.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11);
    doc.text('Warnings', margin, y);
    y += 6;
    warnings.forEach((w) => {
      doc.setFontSize(9);
      doc.setTextColor(w.type === 'danger' ? [239, 68, 68] : [245, 158, 11]);
      doc.text(`• ${w.message}`, margin + 2, y);
      y += 5;
    });
  }

  // Screenshot of 3D view
  if (canvasRef && canvasRef.current) {
    try {
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - margin * 2;
        const imgH = (imgW * canvas.height) / canvas.width;
        if (y + imgH > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(0, 212, 255);
        doc.text('3D Visualization', margin, y);
        y += 5;
        doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      }
    } catch (e) {
      console.warn('Could not capture 3D screenshot:', e);
    }
  }

  doc.save(`batteryforge-${electrical.S}s${electrical.P}p-${Date.now()}.pdf`);
}

export function exportCSV(store) {
  const { electrical, selectedCell } = store;
  if (!electrical) return;

  const { S, P } = electrical;
  const rows = [];

  // Header row: S1, S2, ... SN
  const header = ['P\\S', ...Array.from({ length: S }, (_, i) => `S${i + 1}`)];
  rows.push(header);

  // Data rows: P1, P2, ... PN
  for (let p = 0; p < P; p++) {
    const row = [`P${p + 1}`];
    for (let s = 0; s < S; s++) {
      row.push(`S${s + 1}P${p + 1}`);
    }
    rows.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Add pack summary sheet
  const summaryData = [
    ['Parameter', 'Value'],
    ['Cell', selectedCell?.name || 'Custom'],
    ['Config', `${S}S${P}P`],
    ['Total Cells', electrical.totalCells],
    ['Voltage', `${electrical.packVoltage.toFixed(2)} V`],
    ['Capacity', `${electrical.packCapacityAh.toFixed(2)} Ah`],
    ['Energy', `${electrical.energyWh.toFixed(1)} Wh`],
    ['Max Current', `${electrical.maxDischargeCurrent.toFixed(0)} A`],
    ['Weight', `${electrical.totalWeightKg.toFixed(3)} kg`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  XLSX.utils.book_append_sheet(wb, ws, 'Cell Layout');
  XLSX.writeFile(wb, `batteryforge-${S}s${P}p-${Date.now()}.xlsx`);
}
