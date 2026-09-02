/**
 * SERVICIO PROFESIONAL DE GENERACIÓN DE EXPEDIENTES PDF
 * ME VARIEDADES — PLATAFORMA DE ADMINISTRACIÓN
 */

// Utilidad para convertir URL de imagen remota a base64
async function urlToBase64(url) {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('No se pudo convertir la imagen a base64 para el PDF:', error);
    return null;
  }
}

// Obtener dimensiones reales de una imagen base64 para ajustar aspecto
function getImageDimensions(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = base64;
  });
}

// Formateador de moneda seguro para el reporte PDF (evita glifos rotos y espaciado defectuoso)
function formatColon(monto) {
  const num = parseFloat(monto) || 0;
  return `CRC ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Genera el expediente en PDF (Nivel 1: Individual, Nivel 2: Por Categoría, Nivel 3: Consolidado Completo)
 * Carga dinámica de jsPDF y autoTable bajo demanda.
 * @param {Object} cliente - Datos del cliente ({ nombre_completo, telefono, id, ... })
 * @param {Array} facturas - Lista de comprobantes a incluir
 * @param {String} tituloReporte - Nombre descriptivo del reporte
 */
export async function generarExpedientePDF(cliente, facturas = [], tituloReporte = 'Expediente Completo de Comprobantes') {
  if (!facturas || facturas.length === 0) {
    alert('No hay comprobantes disponibles para exportar.');
    return;
  }

  // Carga asíncrona bajo demanda para mantener el bundle ligero
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalMonto = facturas.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0);

  const nombreCliente = cliente?.nombre_completo || facturas[0]?.cliente_nombre || 'Cliente General';
  const telefonoCliente = cliente?.telefono || facturas[0]?.cliente_telefono || 'No registrado';
  const idCliente = cliente?.id && cliente.id !== 'sin_cliente' ? `CLI-${String(cliente.id).padStart(4, '0')}` : 'General';

  // ==========================================
  // PÁGINA 1: PORTADA Y RESUMEN FINANCIERO
  // ==========================================
  
  // Membrete Superior Institucional
  doc.setFillColor(30, 20, 24); // Tono vino oscuro
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Acento dorado/rosa superior
  doc.setFillColor(244, 180, 200);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(244, 180, 200); // Rosa distintivo
  doc.text('ME VARIEDADES', 14, 16);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 210, 215);
  doc.text('CENTRO DE GESTIÓN Y EXPEDIENTES DIGITALES', 14, 23);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 29);

  // Cuadro de Datos del Titular / Cliente
  doc.setFillColor(248, 245, 246);
  doc.roundedRect(14, 44, pageWidth - 28, 30, 3, 3, 'F');
  doc.setDrawColor(230, 215, 220);
  doc.roundedRect(14, 44, pageWidth - 28, 30, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(45, 25, 32);
  doc.text('DATOS DEL TITULAR / EXPEDIENTE', 20, 52);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 50, 55);
  doc.text(`Cliente: ${nombreCliente}`, 20, 60);
  doc.text(`Identificador: ${idCliente}   |   Teléfono: ${telefonoCliente}`, 20, 67);

  doc.text(`Tipo de Reporte: ${tituloReporte}`, 115, 60);
  doc.text(`Total Documentos: ${facturas.length} archivo${facturas.length > 1 ? 's' : ''}`, 115, 67);

  // Tabla de Resumen Consolidado
  const tableData = facturas.map((f, index) => {
    const tipo = f.tipo_categoria ? f.tipo_categoria.toUpperCase() : (f.tipo_comprobante || 'GENERAL').toUpperCase();
    const ref = f.referencia_id || f.identificador_ref || `DOC-${String(f.id).padStart(4, '0')}`;
    const fecha = f.fecha_emision || 'Sin fecha';
    const montoStr = f.monto ? formatColon(f.monto) : 'CRC 0.00';
    return [`#${index + 1}`, tipo, ref, fecha, montoStr];
  });

  // Fila de Total
  tableData.push(['', '', '', 'TOTAL CONSOLIDADO:', formatColon(totalMonto)]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'CATEGORÍA / TIPO', 'REFERENCIA', 'FECHA EMISIÓN', 'MONTO']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [94, 38, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 40, 45]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 38 },
      3: { cellWidth: 35, halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 235, 238];
        data.cell.styles.textColor = [94, 38, 52];
      }
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PÁGINAS SIGUIENTES: COMPROBANTES ADJUNTOS
  // ==========================================
  for (let i = 0; i < facturas.length; i++) {
    const item = facturas[i];
    doc.addPage();

    // Encabezado de Página de Comprobante
    doc.setFillColor(30, 20, 24);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFillColor(244, 180, 200);
    doc.rect(0, 0, pageWidth, 2, 'F');

    const catLabel = item.tipo_categoria ? item.tipo_categoria.toUpperCase() : 'COMPROBANTE';
    const refLabel = item.referencia_id || item.identificador_ref || `#${item.id}`;
    const montoLabel = item.monto ? formatColon(item.monto) : 'CRC 0.00';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(244, 180, 200);
    doc.text(`COMPROBANTE DIGITAL #${i + 1} DE ${facturas.length} — ${catLabel}`, 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(235, 230, 232);
    doc.text(`Titular: ${nombreCliente}   |   Ref: ${refLabel}   |   Fecha: ${item.fecha_emision || 'N/A'}   |   Monto: ${montoLabel}`, 14, 18);

    // Incrustación de Imagen o Documento
    const imgUrl = item.archivo_url || item.archivo_data;
    if (imgUrl && item.archivo_tipo !== 'pdf') {
      try {
        const base64Img = await urlToBase64(imgUrl);
        if (base64Img) {
          const dims = await getImageDimensions(base64Img);
          
          // Espacio máximo disponible: 182mm ancho x 235mm alto
          const maxW = 182;
          const maxH = 230;
          let drawW = maxW;
          let drawH = (dims.height * maxW) / dims.width;

          if (drawH > maxH) {
            drawH = maxH;
            drawW = (dims.width * maxH) / dims.height;
          }

          const posX = (pageWidth - drawW) / 2;
          const posY = 32 + (maxH - drawH) / 2;

          // Fondo con borde para el marco de la imagen
          doc.setFillColor(250, 248, 249);
          doc.roundedRect(posX - 2, posY - 2, drawW + 4, drawH + 4, 2, 2, 'F');
          doc.setDrawColor(220, 205, 210);
          doc.roundedRect(posX - 2, posY - 2, drawW + 4, drawH + 4, 2, 2, 'S');

          const format = base64Img.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(base64Img, format, posX, posY, drawW, drawH, undefined, 'FAST');
        } else {
          doc.setTextColor(130, 120, 125);
          doc.setFontSize(10);
          doc.text('No se pudo procesar la previsualización del archivo adjunto.', 14, 60);
        }
      } catch (e) {
        doc.setTextColor(130, 120, 125);
        doc.setFontSize(10);
        doc.text('Archivo adjunto digitalizado no disponible para incrustación directa.', 14, 60);
      }
    } else if (item.archivo_tipo === 'pdf') {
      doc.setFillColor(248, 246, 247);
      doc.roundedRect(14, 35, pageWidth - 28, 60, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(94, 38, 52);
      doc.text('DOCUMENTO ADJUNTO FORMATO PDF', 20, 52);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(70, 60, 65);
      doc.text(`Nombre de archivo: ${item.archivo_nombre || 'comprobante.pdf'}`, 20, 62);
      doc.text(`Almacenado de forma segura en la base de datos de ME Variedades.`, 20, 70);
      if (item.archivo_url) {
        doc.setTextColor(138, 78, 88);
        doc.text(`Enlace de descarga: ${item.archivo_url.substring(0, 70)}...`, 20, 78);
      }
    } else {
      doc.setTextColor(130, 120, 125);
      doc.setFontSize(10);
      doc.text('Este registro no contiene archivo adjunto digitalizado.', 14, 60);
    }

    // Pie de página institucional
    doc.setFontSize(8);
    doc.setTextColor(150, 140, 145);
    doc.text(`Expediente Digital ME Variedades — Página ${i + 2} de ${facturas.length + 1}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // Descarga del Archivo
  const nombreLimpio = nombreCliente.replace(/[^a-zA-Z0-9]/g, '_');
  const catLimpia = tituloReporte.replace(/[^a-zA-Z0-9]/g, '_');
  const fechaHoy = new Date().toISOString().split('T')[0];
  doc.save(`Expediente_${nombreLimpio}_${catLimpia}_${fechaHoy}.pdf`);
}

/**
 * Exportación rápida de un comprobante individual
 */
export async function exportarComprobanteIndividualPDF(factura) {
  const cliente = {
    nombre_completo: factura.cliente_nombre || factura.clientes?.nombre_completo || 'Cliente Registrado',
    telefono: factura.cliente_telefono || factura.clientes?.telefono || '',
    id: factura.cliente_id || ''
  };

  const tipo = (factura.tipo_categoria || 'Comprobante').toUpperCase();
  const ref = factura.referencia_id || `#${factura.id}`;
  await generarExpedientePDF(cliente, [factura], `Comprobante ${tipo} (${ref})`);
}
