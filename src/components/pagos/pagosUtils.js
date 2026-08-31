import { calcularEstadoPago } from '../../context/PagosContext';

/**
 * Formatea un numero como moneda costarricense.
 */
export function formatMoneda(valor) {
  const num = Number(valor) || 0;
  return '₡' + num.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español.
 */
export function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const [year, month, day] = fechaStr.split('-').map(Number);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${meses[month - 1]} ${year}`;
}

/**
 * Calcula el porcentaje pagado de un pago para la barra de progreso.
 */
export function calcularPorcentajePagado(pago) {
  if (!pago.monto_total || pago.monto_total === 0) return 100;
  const pagado = pago.monto_total - (pago.saldo_pendiente || 0);
  return Math.min(100, Math.round((pagado / pago.monto_total) * 100));
}

/**
 * Devuelve la clase CSS para el badge de estado.
 */
export function getEstadoClass(pago) {
  const estado = calcularEstadoPago(pago);
  const mapa = {
    pagado: 'badge-pagado',
    pendiente: 'badge-pendiente',
    proximo: 'badge-proximo',
    vencido: 'badge-vencido',
  };
  return mapa[estado] || 'badge-pendiente';
}

/**
 * Devuelve el texto de la etiqueta del semaforo.
 */
export function getEstadoLabel(pago) {
  const estado = calcularEstadoPago(pago);
  const mapa = {
    pagado: 'Pagado',
    pendiente: 'Pendiente',
    proximo: 'Proximo a vencer',
    vencido: 'Vencido',
  };
  return mapa[estado] || 'Pendiente';
}

/**
 * Clase de color para la barra de progreso.
 */
export function getProgressClass(pago) {
  const estado = calcularEstadoPago(pago);
  if (estado === 'pagado') return 'progress-green';
  if (estado === 'vencido') return 'progress-red';
  return 'progress-amber';
}
