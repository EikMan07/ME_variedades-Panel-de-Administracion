/**
 * ============================================================================
 * MOTOR CENTRAL DE NOTIFICACIONES DE COBRO — PROYECTO MARÍA (v4.0)
 * Requisitos: RF-08, RF-53, RF-54, RF-55, RF-56
 * ============================================================================
 *
 * Centraliza la identificación reactiva de cuotas exigibles de:
 * 1. Préstamos activos (cuotas JSONB y saldo).
 * 2. Ventas a crédito activas (pedidos con modalidad='credito' y cuotas JSONB).
 * 3. Cuentas por cobrar en Pagos (pagos con saldo_pendiente > 0 y fecha_acordada).
 *
 * Clasifica cada notificación en:
 * - 'atrasado': Cuota vencida en el pasado sin cubrir (máxima urgencia).
 * - 'hoy': Cuota que vence el día de hoy (mismo día).
 * - 'manana': Cuota que vence el día de mañana (un día antes).
 */

import {
  clasificarFechaVencimiento,
  formatearFecha,
  formatearMoneda,
  generarLinkWhatsApp,
  calcularMoratoriaCuota
} from '../utils/utils.js';

/**
 * Construye un mensaje formal, educado y claro para enviar por WhatsApp al cliente.
 */
function construirMensajeCobroWhatsApp({
  clienteNombre,
  origenTexto,
  concepto,
  montoFormateado,
  vencimiento,
  fechaFormateada,
  moraMonto = 0
}) {
  const nombre = clienteNombre || 'Estimado/a cliente';
  const detalle = concepto ? ` (${concepto})` : '';

  if (vencimiento === 'atrasado') {
    const detalleMora = moraMonto > 0 ? ` (incluye ${formatearMoneda(moraMonto)} de mora por atraso)` : '';
    return `¡Hola ${nombre}! Le saludamos cordialmente de ME Variedades. Le recordamos que presenta una cuota pendiente de ${origenTexto}${detalle} por un monto de ${montoFormateado}${detalleMora}, la cual venció el ${fechaFormateada}. Le agradecemos comunicarse con nosotros para coordinar su pago. ¡Muchas gracias!`;
  }

  if (vencimiento === 'hoy') {
    return `¡Hola ${nombre}! Le saludamos cordialmente de ME Variedades. Le recordamos que el día de hoy vence su cuota de ${origenTexto}${detalle} por un monto de ${montoFormateado}. Quedamos atentos a su comprobante o abono. ¡Muchas gracias!`;
  }

  // manana
  return `¡Hola ${nombre}! Le saludamos cordialmente de ME Variedades. Le recordamos que el día de mañana vence su cuota de ${origenTexto}${detalle} por un monto de ${montoFormateado}. ¡Muchas gracias por su preferencia y puntualidad!`;
}

/**
 * Obtiene y clasifica todas las notificaciones de cobro vigentes.
 *
 * @param {Object} params
 * @param {Array} [params.prestamos=[]] - Lista de préstamos desde BD / Contexto.
 * @param {Array} [params.pedidos=[]] - Lista de pedidos / ventas desde BD / Contexto.
 * @param {Array} [params.pagos=[]] - Lista de pagos / cuentas por cobrar desde BD / Contexto.
 * @param {Date} [params.fechaReferencia=new Date()] - Fecha base para pruebas y cálculo local seguro.
 * @returns {Array<Object>} Lista de notificaciones ordenadas por prioridad de cobro.
 */
export function obtenerNotificacionesCobro({
  prestamos = [],
  pedidos = [],
  pagos = [],
  fechaReferencia = new Date()
} = {}) {
  const notificaciones = [];

  // ============================================================================
  // 1. EVALUAR PRÉSTAMOS
  // ============================================================================
  (prestamos || []).forEach((pr) => {
    const saldo = Number(pr.saldo_pendiente);
    if (pr.estado === 'liquidado' || (saldo !== undefined && saldo <= 0)) {
      return;
    }

    const clienteNombre = pr.beneficiario_nombre || pr.clientes?.nombre_completo || pr.nombre_tercero || pr.cliente_nombre || 'Beneficiario';
    const telefono = pr.beneficiario_telefono || pr.clientes?.telefono || pr.telefono || pr.telefono_tercero || '';
    const abonos = Array.isArray(pr.abonos) ? pr.abonos : [];
    let saldoAbonosRestante = abonos.reduce((sum, a) => sum + (Number(a.monto) || 0), 0);

    const cuotas = Array.isArray(pr.cuotas) ? pr.cuotas : [];

    if (cuotas.length > 0) {
      cuotas.forEach((c, idx) => {
        const numCuota = c.numeroCuota || idx + 1;
        const totalCuotas = cuotas.length;
        const montoCuota = Number(c.montoRealAcordado !== undefined ? c.montoRealAcordado : (c.montoSugerido || 0));

        // Verificar si la cuota ya está completamente pagada
        if (c.pagada === true) {
          return;
        }

        // Si los abonos acumulados cubren esta cuota
        if (saldoAbonosRestante >= montoCuota && montoCuota > 0) {
          saldoAbonosRestante -= montoCuota;
          return;
        }

        const montoExigible = Math.max(0, montoCuota - saldoAbonosRestante);
        saldoAbonosRestante = 0; // Se consumió el abono restante en esta cuota

        if (montoExigible <= 0) return;

        const fechaVenc = c.fechaVencimiento || c.fecha;
        const clasificacion = clasificarFechaVencimiento(fechaVenc, fechaReferencia);

        if (clasificacion === 'atrasado' || clasificacion === 'hoy' || clasificacion === 'manana') {
          let moraMonto = 0;
          if (clasificacion === 'atrasado' && Number(pr.moratoria_monto) > 0) {
            const resMora = calcularMoratoriaCuota(fechaVenc, pr.moratoria_tipo, pr.moratoria_monto, fechaReferencia);
            moraMonto = resMora.montoMora;
          }
          const montoTotalExigible = montoExigible + moraMonto;

          const concepto = `Préstamo #PR-${String(pr.id).padStart(4, '0')} • Cuota ${numCuota}/${totalCuotas}`;
          const montoFormateado = formatearMoneda(montoTotalExigible);
          const fechaFormateada = formatearFecha(fechaVenc, 'corto');

          const linkWhatsApp = generarLinkWhatsApp(
            telefono,
            construirMensajeCobroWhatsApp({
              clienteNombre,
              origenTexto: 'Préstamo',
              concepto,
              montoFormateado,
              vencimiento: clasificacion,
              fechaFormateada,
              moraMonto
            })
          );

          notificaciones.push({
            id: `cobro-prestamo-${pr.id}-cuota-${numCuota}`,
            origen: 'prestamo',
            origenTexto: 'Préstamo',
            registroId: pr.id,
            clienteNombre,
            telefono,
            montoBase: montoExigible,
            moraMonto,
            montoCobro: montoTotalExigible,
            montoCobroFormateado: montoFormateado,
            vencimiento: clasificacion, // 'atrasado' | 'hoy' | 'manana'
            fechaVencimiento: fechaVenc,
            fechaVencimientoFormateada: fechaFormateada,
            concepto,
            numeroCuota: numCuota,
            totalCuotas,
            linkWhatsApp
          });
        }
      });
    } else {
      // Fallback para préstamos antiguos o de pago único sin cuotas desglosadas
      const fechaRef = pr.fecha_limite || pr.fecha_vencimiento || pr.fecha_acordada;
      const clasificacion = clasificarFechaVencimiento(fechaRef, fechaReferencia);

      if (clasificacion === 'atrasado' || clasificacion === 'hoy' || clasificacion === 'manana') {
        let moraMonto = 0;
        if (clasificacion === 'atrasado' && Number(pr.moratoria_monto) > 0 && fechaRef) {
          const resMora = calcularMoratoriaCuota(fechaRef, pr.moratoria_tipo, pr.moratoria_monto, fechaReferencia);
          moraMonto = resMora.montoMora;
        }
        const montoBase = saldo > 0 ? saldo : (Number(pr.total_devolver || pr.monto_total) || 0);
        const montoTotalExigible = montoBase + moraMonto;

        const concepto = `Préstamo #PR-${String(pr.id).padStart(4, '0')} • Saldo total`;
        const montoFormateado = formatearMoneda(montoTotalExigible);
        const fechaFormateada = formatearFecha(fechaRef, 'corto');

        const linkWhatsApp = generarLinkWhatsApp(
          telefono,
          construirMensajeCobroWhatsApp({
            clienteNombre,
            origenTexto: 'Préstamo',
            concepto,
            montoFormateado,
            vencimiento: clasificacion,
            fechaFormateada,
            moraMonto
          })
        );

        notificaciones.push({
          id: `cobro-prestamo-${pr.id}-total`,
          origen: 'prestamo',
          origenTexto: 'Préstamo',
          registroId: pr.id,
          clienteNombre,
          telefono,
          montoBase,
          moraMonto,
          montoCobro: montoTotalExigible,
          montoCobroFormateado: montoFormateado,
          vencimiento: clasificacion,
          fechaVencimiento: fechaRef,
          fechaVencimientoFormateada: fechaFormateada,
          concepto,
          numeroCuota: 1,
          totalCuotas: 1,
          linkWhatsApp
        });
      }
    }
  });

  // ============================================================================
  // 2. EVALUAR VENTAS A CRÉDITO (PEDIDOS)
  // ============================================================================
  (pedidos || []).forEach((ped) => {
    const modalidad = String(ped.modalidad || '').toLowerCase();
    if (modalidad !== 'credito' || ped.estado === 'Liquidado') {
      return;
    }

    const clienteNombre = ped.clientes?.nombre_completo || ped.cliente_nombre || 'Cliente';
    const telefono = ped.clientes?.telefono || ped.cliente_telefono || '';
    const cuotas = Array.isArray(ped.cuotas) ? ped.cuotas : [];

    cuotas.forEach((c, idx) => {
      const numCuota = c.numeroCuota || idx + 1;
      const totalCuotas = cuotas.length || ped.num_plazos || 1;

      if (c.pagada === true) return;

      const montoCuota = Number(c.montoRealAcordado !== undefined ? c.montoRealAcordado : (c.montoSugerido || 0));
      const montoPagado = Number(c.montoPagado || 0);
      const montoExigible = Math.max(0, montoCuota - montoPagado);

      if (montoExigible <= 0) return;

      const fechaVenc = c.fechaVencimiento || c.fecha;
      const clasificacion = clasificarFechaVencimiento(fechaVenc, fechaReferencia);

      if (clasificacion === 'atrasado' || clasificacion === 'hoy' || clasificacion === 'manana') {
        let moraMonto = 0;
        if (clasificacion === 'atrasado' && Number(ped.moratoria_monto) > 0) {
          const resMora = calcularMoratoriaCuota(fechaVenc, ped.moratoria_tipo, ped.moratoria_monto, fechaReferencia);
          moraMonto = resMora.montoMora;
        }
        const montoTotalExigible = montoExigible + moraMonto;

        const concepto = `Venta a crédito #VTA-${String(ped.id).padStart(4, '0')} • Cuota ${numCuota}/${totalCuotas}`;
        const montoFormateado = formatearMoneda(montoTotalExigible);
        const fechaFormateada = formatearFecha(fechaVenc, 'corto');

        const linkWhatsApp = generarLinkWhatsApp(
          telefono,
          construirMensajeCobroWhatsApp({
            clienteNombre,
            origenTexto: 'Venta a crédito',
            concepto,
            montoFormateado,
            vencimiento: clasificacion,
            fechaFormateada,
            moraMonto
          })
        );

        notificaciones.push({
          id: `cobro-pedido-${ped.id}-cuota-${numCuota}`,
          origen: 'venta_credito',
          origenTexto: 'Venta a crédito',
          registroId: ped.id,
          clienteNombre,
          telefono,
          montoBase: montoExigible,
          moraMonto,
          montoCobro: montoTotalExigible,
          montoCobroFormateado: montoFormateado,
          vencimiento: clasificacion,
          fechaVencimiento: fechaVenc,
          fechaVencimientoFormateada: fechaFormateada,
          concepto,
          numeroCuota: numCuota,
          totalCuotas,
          linkWhatsApp
        });
      }
    });
  });

  // ============================================================================
  // 3. EVALUAR CUENTAS POR COBRAR (PAGOS)
  // ============================================================================
  (pagos || []).forEach((p) => {
    const saldo = Number(p.saldo_pendiente);
    if (p.estado === 'pagado' || isNaN(saldo) || saldo <= 0) {
      return;
    }

    const fechaRef = p.fecha_acordada || p.fecha_vencimiento || p.fecha_limite;
    if (!fechaRef) return;

    const clasificacion = clasificarFechaVencimiento(fechaRef, fechaReferencia);

    if (clasificacion === 'atrasado' || clasificacion === 'hoy' || clasificacion === 'manana') {
      const clienteNombre = p.clientes?.nombre_completo || p.cliente_nombre || p.cliente || 'Cliente';
      const telefono = p.clientes?.telefono || p.cliente_telefono || '';
      const concepto = p.concepto ? `Cobro: ${p.concepto}` : `Cuenta #PAG-${String(p.id).padStart(4, '0')}`;
      const montoFormateado = formatearMoneda(saldo);
      const fechaFormateada = formatearFecha(fechaRef, 'corto');

      const linkWhatsApp = generarLinkWhatsApp(
        telefono,
        construirMensajeCobroWhatsApp({
          clienteNombre,
          origenTexto: 'Cuenta por cobrar',
          concepto,
          montoFormateado,
          vencimiento: clasificacion,
          fechaFormateada
        })
      );

      notificaciones.push({
        id: `cobro-pago-${p.id}`,
        origen: 'cuenta_cobrar',
        origenTexto: 'Cuenta por cobrar',
        registroId: p.id,
        clienteNombre,
        telefono,
        montoCobro: saldo,
        montoCobroFormateado: montoFormateado,
        vencimiento: clasificacion,
        fechaVencimiento: fechaRef,
        fechaVencimientoFormateada: fechaFormateada,
        concepto,
        numeroCuota: null,
        totalCuotas: null,
        linkWhatsApp
      });
    }
  });

  // ============================================================================
  // 4. ORDENAMIENTO POR PRIORIDAD OPERATIVA
  // ============================================================================
  const ordenVencimiento = { atrasado: 1, hoy: 2, manana: 3 };

  return notificaciones.sort((a, b) => {
    const prioA = ordenVencimiento[a.vencimiento] || 99;
    const prioB = ordenVencimiento[b.vencimiento] || 99;

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Si tienen la misma prioridad, ordenar por fecha más cercana primero
    if (a.fechaVencimiento < b.fechaVencimiento) return -1;
    if (a.fechaVencimiento > b.fechaVencimiento) return 1;

    // Y luego por monto mayor primero
    return b.montoCobro - a.montoCobro;
  });
}
