import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const pageWidth = doc.internal.pageSize.getWidth();
const clienteNombre = 'Eiker Cordero Soto';
const clienteTel = '8888-7777';

// Sanitizador universal para asegurar inmunidad a errores de codificación en jsPDF
const cleanPDFText = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/₡\s*/g, 'CRC ')
    .replace(/[\u20A1]\s*/g, 'CRC ');
};

// 1. Encabezado Oficial ME VARIEDADES (#12111A con filete dorado #F59E0B)
doc.setFillColor(18, 17, 26);
doc.rect(0, 0, pageWidth, 36, 'F');

// Línea de acento dorado
doc.setFillColor(245, 158, 11);
doc.rect(0, 0, pageWidth, 2.5, 'F');

// Título del negocio
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.setTextColor(255, 255, 255);
doc.text('ME VARIEDADES', 14, 15);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(148, 163, 184); // #94A3B8
doc.text('Comprobante Oficial de Movimientos', 14, 21);
doc.text('Costa Rica • Atención al Cliente', 14, 26);

// Bloque derecho: ESTADO DE CUENTA y fecha de emisión (sin ID interno de cliente)
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(245, 158, 11); // #F59E0B
doc.text('ESTADO DE CUENTA', pageWidth - 14, 16, { align: 'right' });

const hoy = new Date();
const fechaEmisionStr = hoy.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(203, 213, 225); // #CBD5E1
doc.text(`Emisión: ${fechaEmisionStr}`, pageWidth - 14, 23.5, { align: 'right' });

// 2. Ficha del Titular (Caja suave con esquinas redondeadas y borde sutil)
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

// 3. Tarjetas KPI de Resumen Financiero Ejecutivo
y += 26;
const boxWidth = (pageWidth - 28 - 8) / 3;

const totalFacturado = 165000;
const totalPagado = 55000;
const saldoPendiente = 110000;

// Tarjeta 1: Total Facturado
doc.setFillColor(248, 250, 252); // #F8FAFC
doc.setDrawColor(226, 232, 240); // #E2E8F0
doc.roundedRect(14, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(100, 116, 139);
doc.text('TOTAL FACTURADO', 18, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(15, 23, 42);
doc.text(`CRC ${totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18, y + 14);

// Tarjeta 2: Total Pagado / Abonos (Verde Esmeralda suave)
doc.setFillColor(240, 253, 244); // #F0FDF4
doc.setDrawColor(187, 247, 208); // #BBF7D0
doc.roundedRect(14 + boxWidth + 4, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(21, 128, 61); // #15803D
doc.text('TOTAL PAGADO / ABONOS', 18 + boxWidth + 4, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(4, 120, 87); // #047857
doc.text(`CRC ${totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18 + boxWidth + 4, y + 14);

// Tarjeta 3: Saldo Neto Pendiente (Ámbar elegante)
doc.setFillColor(255, 251, 235); // #FFFBEB
doc.setDrawColor(253, 230, 138); // #FDE68A
doc.roundedRect(14 + (boxWidth * 2) + 8, y, boxWidth, 19, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(180, 83, 9); // #B45309
doc.text('SALDO NETO PENDIENTE', 18 + (boxWidth * 2) + 8, y + 6.5);
doc.setFontSize(11);
doc.setTextColor(180, 83, 9);
doc.text(`CRC ${saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18 + (boxWidth * 2) + 8, y + 14);

// 4. Tabla de Movimientos (autoTable profesional con ajuste de línea y contraste óptimo)
y += 25;

const movimientos = [
  {
    fecha: '2026-08-30',
    tipo: 'Préstamo',
    montoOriginal: 110000,
    pagosAbonos: 0,
    saldoRestante: 110000,
    estado: 'Al día',
  },
  {
    fecha: '2026-08-15',
    tipo: 'Venta a Crédito',
    montoOriginal: 55000,
    pagosAbonos: 55000,
    saldoRestante: 0,
    estado: 'Cancelado',
  },
];

const bodyData = movimientos.map((m) => [
  cleanPDFText(m.fecha),
  cleanPDFText(m.tipo),
  `CRC ${m.montoOriginal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  `CRC ${m.pagosAbonos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  `CRC ${m.saldoRestante.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  cleanPDFText(m.estado),
]);

autoTable(doc, {
  startY: y,
  head: [['Fecha', 'Tipo', 'Original', 'Pagado', 'Saldo', 'Estado']],
  body: bodyData,
  theme: 'grid',
  margin: { left: 14, right: 14 },
  headStyles: {
    fillColor: [30, 27, 46], // #1E1B2E Fondo oscuro sobrio oficial
    textColor: [255, 255, 255],
    fontSize: 8,
    fontStyle: 'bold',
    halign: 'left',
    cellPadding: 3,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252], // #F8FAFC Fondo alternado muy sutil
  },
  styles: {
    overflow: 'linebreak',
    fontSize: 8,
    textColor: [30, 41, 59], // #1E293B
    cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    lineColor: [226, 232, 240], // #E2E8F0
    lineWidth: 0.2,
  },
  columnStyles: {
    0: { cellWidth: 28 }, // Fecha
    1: { cellWidth: 32 }, // Tipo
    2: { cellWidth: 32, halign: 'right' }, // Original
    3: { cellWidth: 30, halign: 'right', textColor: [4, 120, 87] }, // Pagado (verde)
    4: { cellWidth: 34, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }, // Saldo (ámbar)
    5: { cellWidth: 26, halign: 'center' }, // Estado
  },
});

// Pie de página de agradecimiento
const finalY = doc.lastAutoTable?.finalY || 240;
doc.setFont('helvetica', 'italic');
doc.setFontSize(8);
doc.setTextColor(100, 116, 139);
doc.text('Gracias por su preferencia y confianza comercial en ME Variedades.', 14, Math.min(285, finalY + 10));

const outputPath = path.resolve('scratch', 'Estado_Cuenta_Eiker_Prueba.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);
console.log('PDF generado exitosamente en:', outputPath);
