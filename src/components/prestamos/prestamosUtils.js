import { calcularEstadoPrestamo } from '../../context/PrestamosContext';

/**
 * Formatea un número como moneda en colones costarricenses (₡).
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
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length < 3) return fechaStr;
  const [year, month, day] = partes.map(Number);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${meses[month - 1]} ${year}`;
}

/**
 * Calcula los días restantes para la fecha límite o los días de atraso.
 */
export function calcularDiasRestantes(fechaLimiteStr) {
  if (!fechaLimiteStr) return { dias: 0, atrasado: false, texto: 'Sin fecha' };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaLimiteStr + 'T00:00:00');

  const diffMs = fecha - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return {
      dias: Math.abs(diffDias),
      atrasado: true,
      texto: `Venció hace ${Math.abs(diffDias)} días`
    };
  }

  if (diffDias === 0) {
    return {
      dias: 0,
      atrasado: false,
      texto: 'Vence hoy'
    };
  }

  if (diffDias === 1) {
    return {
      dias: 1,
      atrasado: false,
      texto: 'Vence mañana'
    };
  }

  return {
    dias: diffDias,
    atrasado: false,
    texto: `Quedan ${diffDias} días`
  };
}

/**
 * Devuelve la configuración de badge semaforizado para un préstamo.
 * RF-42.
 */
export function getEstadoBadge(prestamo) {
  const estado = calcularEstadoPrestamo(prestamo);

  switch (estado) {
    case 'liquidado':
      return {
        label: 'Liquidado',
        className: 'badge-prestamo-liquidado',
        color: '#f4b4c8'
      };
    case 'atrasado':
      return {
        label: 'Atrasado / Vencido',
        className: 'badge-prestamo-atrasado',
        color: '#B23A48'
      };
    case 'proximo':
      return {
        label: 'Próximo a Vencer',
        className: 'badge-prestamo-proximo',
        color: '#C9A24B'
      };
    case 'al_dia':
    default:
      return {
        label: 'Al Día',
        className: 'badge-prestamo-aldia',
        color: '#6E8F6B'
      };
  }
}

/**
 * Calcula el porcentaje retornado/pagado de un préstamo.
 */
export function calcularPorcentajeRetorno(prestamo) {
  const total = Number(prestamo.monto_total) || 0;
  if (total <= 0) return 100;
  const saldo = Number(prestamo.saldo_pendiente) || 0;
  const abonado = Math.max(0, total - saldo);
  return Math.min(100, Math.round((abonado / total) * 100));
}

/**
 * Clase de color para la barra de progreso de amortización.
 */
export function getProgressClass(prestamo) {
  const estado = calcularEstadoPrestamo(prestamo);
  if (estado === 'liquidado') return 'progress-liquidado';
  if (estado === 'atrasado') return 'progress-red';
  if (estado === 'proximo') return 'progress-amber';
  return 'progress-green';
}
