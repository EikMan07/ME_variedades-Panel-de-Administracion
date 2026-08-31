import { calcularDiasDesdeFecha } from '../../context/CobrosContext';

/**
 * Formatea un número como moneda en colones costarricenses.
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
 * Devuelve el texto y la clase CSS del semáforo según los días transcurridos desde el cobro.
 * RF-24: Indicador dinámico de días transcurridos.
 */
export function getBadgeAntiguedad(fechaCobro) {
  const dias = calcularDiasDesdeFecha(fechaCobro);

  if (dias === 0) {
    return {
      dias,
      texto: 'Hoy',
      className: 'badge-cobro-hoy',
      nivel: 'verde',
      descripcion: 'Cobro registrado hoy'
    };
  }

  if (dias === 1) {
    return {
      dias,
      texto: 'Ayer (hace 1 día)',
      className: 'badge-cobro-reciente',
      nivel: 'verde',
      descripcion: 'Cobro muy reciente'
    };
  }

  if (dias <= 3) {
    return {
      dias,
      texto: `Hace ${dias} días`,
      className: 'badge-cobro-reciente',
      nivel: 'verde',
      descripcion: 'Al día (reciente)'
    };
  }

  if (dias <= 7) {
    return {
      dias,
      texto: `Hace ${dias} días`,
      className: 'badge-cobro-moderado',
      nivel: 'ambar',
      descripcion: 'Semana en curso'
    };
  }

  if (dias <= 14) {
    return {
      dias,
      texto: `Hace ${dias} días`,
      className: 'badge-cobro-atencion',
      nivel: 'ambar-oscuro',
      descripcion: 'Requiere seguimiento'
    };
  }

  return {
    dias,
    texto: `Hace ${dias} días — Atención`,
    className: 'badge-cobro-alerta',
    nivel: 'rojo',
    descripcion: 'Cobro prioritario / atrasado'
  };
}

/**
 * Obtiene el estilo y badge del método de pago.
 */
export function getMetodoInfo(metodo) {
  const m = (metodo || 'Efectivo').toLowerCase();
  if (m.includes('sinpe')) {
    return { label: 'SINPE Móvil', className: 'badge-metodo-sinpe' };
  }
  if (m.includes('efectivo')) {
    return { label: 'Efectivo', className: 'badge-metodo-efectivo' };
  }
  if (m.includes('tarjeta')) {
    return { label: 'Tarjeta', className: 'badge-metodo-tarjeta' };
  }
  if (m.includes('deposito') || m.includes('depósito') || m.includes('transf')) {
    return { label: 'Transferencia', className: 'badge-metodo-transf' };
  }
  return { label: metodo || 'Otro', className: 'badge-metodo-otro' };
}
