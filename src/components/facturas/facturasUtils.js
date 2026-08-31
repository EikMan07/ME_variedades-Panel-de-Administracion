/**
 * Formatea un número como moneda en colones (₡).
 */
export function formatMoneda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = Number(valor) || 0;
  return '₡' + num.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español.
 */
export function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length < 3) return fechaStr;
  const [year, month, day] = partes.map(Number);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${meses[month - 1]} ${year}`;
}

/**
 * Formatea bytes a KB o MB.
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Obtiene la configuración de categoría de comprobante.
 */
export function getCategoriaInfo(tipo) {
  switch (tipo) {
    case 'pedidos':
      return {
        label: 'Factura de Pedido',
        shortLabel: 'Pedido',
        className: 'badge-cat-pedidos',
        color: '#C48B9F',
        bg: 'rgba(154, 110, 121, 0.2)'
      };
    case 'pagos':
      return {
        label: 'Pagos y Cuentas',
        shortLabel: 'Pago',
        className: 'badge-cat-pagos',
        color: '#88C985',
        bg: 'rgba(110, 143, 107, 0.2)'
      };
    case 'cobros':
      return {
        label: 'Comprobante de Cobro',
        shortLabel: 'Cobro',
        className: 'badge-cat-cobros',
        color: '#FACC15',
        bg: 'rgba(212, 175, 55, 0.2)'
      };
    case 'prestamos':
      return {
        label: 'Comprobante de Préstamo',
        shortLabel: 'Préstamo',
        className: 'badge-cat-prestamos',
        color: '#f4b4c8',
        bg: 'rgba(244, 180, 200, 0.2)'
      };
    default:
      return {
        label: 'Comprobante',
        shortLabel: 'General',
        className: 'badge-cat-general',
        color: '#E5E7EB',
        bg: 'rgba(255, 255, 255, 0.1)'
      };
  }
}

/**
 * Dispara la descarga del archivo base64 en el navegador.
 */
export function descargarArchivo(factura) {
  if (!factura || !factura.archivo_data) return;

  const link = document.createElement('a');
  link.href = factura.archivo_data;
  link.download = factura.archivo_nombre || `comprobante_${factura.id}.${factura.archivo_tipo === 'pdf' ? 'pdf' : 'png'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
