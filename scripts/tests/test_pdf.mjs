import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const pageWidth = doc.internal.pageSize.getWidth();
const clienteNombre = 'Mariel Chavarria';
const clienteTel = '6011-9920';
const fechaEmisionStr = '6 de septiembre de 2026';
const clienteIdStr = 'CLI-0006';

// 1. Encabezado Oficial
doc.setFillColor(18, 17, 26); // #12111A
doc.rect(0, 0, pageWidth, 36, 'F');

// Línea de acento dorado
doc.setFillColor(245, 158, 11); // #F59E0B
doc.rect(0, 0, pageWidth, 2.5, 'F');

// Título negocio
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(255, 255, 255);
doc.text('ME VARIEDADES', 14, 15);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(148, 163, 184); // #94A3B8
doc.text('Comprobante Oficial de Movimientos, Ventas y Créditos', 14, 21);
doc.text('San José, Costa Rica • Atención al Cliente', 14, 26);

// Bloque derecho
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(245, 158, 11); // #F59E0B
doc.text('ESTADO DE CUENTA', pageWidth - 14, 15, { align: 'right' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(203, 213, 225); // #CBD5E1
doc.text(`Emisión: ${fechaEmisionStr}`, pageWidth - 14, 21.5, { align: 'right' });
doc.text(`ID Cliente: ${clienteIdStr}`, pageWidth - 14, 26.5, { align: 'right' });

// 2. Ficha del Titular
let y = 43;
doc.setFillColor(248, 250, 252); // #F8FAFC
doc.setDrawColor(226, 232, 240); // #E2E8F0
doc.setLineWidth(0.3);
doc.roundedRect(14, y, pageWidth - 28, 20, 2.5, 2.5, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(100, 116, 139); // #64748B
doc.text('TITULAR DE LA CUENTA', 19, y + 6.5);

doc.setFontSize(11.5);
doc.setTextColor(15, 23, 42); // #0F172A
doc.text(clienteNombre, 19, y + 14);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(71, 85, 105); // #475569
doc.text(`Teléfono: ${clienteTel}`, pageWidth - 19, y + 14, { align: 'right' });

// 3. Tarjetas KPI de Resumen
y += 26;
const boxWidth = (pageWidth - 28 - 8) / 3;

// Facturado
doc.setFillColor(248, 250, 252);
doc.setDrawColor(226, 232, 240);
doc.roundedRect(14, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(100, 116, 139);
doc.text('TOTAL FACTURADO', 18, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(15, 23, 42);
doc.text('CRC 225,000.00', 18, y + 14);

// Pagado
doc.setFillColor(240, 253, 244); // #F0FDF4
doc.setDrawColor(187, 247, 208); // #BBF7D0
doc.roundedRect(14 + boxWidth + 4, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(21, 128, 61); // #15803D
doc.text('TOTAL PAGADO / ABONOS', 18 + boxWidth + 4, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(4, 120, 87); // #047857
doc.text('CRC 0.00', 18 + boxWidth + 4, y + 14);

// Saldo
doc.setFillColor(255, 251, 235); // #FFFBEB
doc.setDrawColor(253, 230, 138); // #FDE68A
doc.roundedRect(14 + (boxWidth * 2) + 8, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(180, 83, 9); // #B45309
doc.text('SALDO NETO PENDIENTE', 18 + (boxWidth * 2) + 8, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(180, 83, 9);
doc.text('CRC 225,000.00', 18 + (boxWidth * 2) + 8, y + 14);

// 4. Tabla de Movimientos
y += 26;

const bodyData = [
  [
    '2026-08-30',
    '#PR-0001',
    'Préstamo',
    'Préstamo de dinero (Capital CRC 200,000.00, Tasa 12.5%)',
    'CRC 225,000.00',
    'CRC 0.00',
    'CRC 225,000.00',
    'Activo'
  ]
];

autoTable(doc, {
  startY: y,
  head: [['Fecha', 'Folio', 'Tipo', 'Detalle / Concepto', 'Original', 'Pagado', 'Saldo', 'Estado']],
  body: bodyData,
  theme: 'grid',
  margin: { left: 12, right: 12 },
  headStyles: {
    fillColor: [30, 27, 46], // #1E1B2E
    textColor: [255, 255, 255],
    fontSize: 8,
    fontStyle: 'bold',
    halign: 'left',
    cellPadding: 3,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252], // #F8FAFC
  },
  styles: {
    overflow: 'linebreak',
    fontSize: 8,
    textColor: [30, 41, 59],
    cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
    lineColor: [226, 232, 240],
    lineWidth: 0.2,
  },
  columnStyles: {
    0: { cellWidth: 20 }, // Fecha
    1: { cellWidth: 18, fontStyle: 'bold', textColor: [15, 23, 42] }, // Folio
    2: { cellWidth: 20 }, // Tipo
    3: { cellWidth: 'auto' }, // Detalle / Concepto
    4: { cellWidth: 26, halign: 'right' }, // Original
    5: { cellWidth: 22, halign: 'right', textColor: [4, 120, 87] }, // Pagado
    6: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }, // Saldo
    7: { cellWidth: 18, halign: 'center' }, // Estado
  },
});

const finalY = doc.lastAutoTable?.finalY || 240;
doc.setFont('helvetica', 'italic');
doc.setFontSize(8);
doc.setTextColor(100, 116, 139);
doc.text('Gracias por su preferencia y confianza comercial en ME Variedades.', 14, Math.min(285, finalY + 10));

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('scratch/test_output.pdf', buffer);
console.log('PDF written successfully, size:', buffer.length);
console.log('Column widths:', doc.lastAutoTable.columns.map(c => ({ index: c.index, width: Math.round(c.width * 100) / 100 })));
console.log('Row 0 cells text:', doc.lastAutoTable.body[0].cells[3].text);
