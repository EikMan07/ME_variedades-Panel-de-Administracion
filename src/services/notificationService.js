/**
 * Servicio de Notificaciones y Alertas Inteligentes
 * Plataforma ME Variedades
 * Iconografía 100% SVG Vectorial - Sin Emojis
 */

// Modo 100% Silencioso (Sin reproducción de sonidos)
export function playNotificationSound() {
  // Función inerte: todos los efectos de audio han sido suprimidos
}

import { obtenerNotificacionesCobro } from './cobroNotificationService.js';

// Generador de alertas inteligentes a partir de datos reales de Supabase
export function generarNotificaciones({ clientes = [], productos = [], pagos = [], prestamos = [], pedidos = [] }) {
  const notificaciones = [];
  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth() + 1;

  // 1. Alertas de Cumpleaños del Día
  clientes.forEach(c => {
    const diaC = Number(c.dia_cumpleanos || c.dia_cumple || c.dia) || 0;
    const mesC = Number(c.mes_cumpleanos || c.mes_cumple || c.mes) || 0;
    const nombre = c.nombre_completo || c.nombre || 'Cliente';

    if (diaC === diaActual && mesC === mesActual) {
      notificaciones.push({
        id: `cumple-${c.id}`,
        tipo: 'cumpleanos',
        titulo: 'Cumpleaños de Hoy',
        mensaje: `${nombre} celebra su cumpleaños hoy.`,
        telefono: c.telefono || '',
        clienteNombre: nombre,
        etiqueta: 'Hoy',
        prioridad: 'alta',
        accion: 'whatsapp',
        link: '/clientes'
      });
    }
  });

  // 2. Alertas de Inventario y Stock
  productos.forEach(p => {
    const stock = Number(p.stock) || 0;
    const nombre = p.nombre || 'Producto';

    if (stock === 0) {
      notificaciones.push({
        id: `stock-out-${p.id}`,
        tipo: 'stock_agotado',
        titulo: 'Producto Agotado',
        mensaje: `"${nombre}" no cuenta con unidades disponibles en almacén.`,
        etiqueta: 'Urgente',
        prioridad: 'critica',
        accion: 'inventario',
        link: '/productos'
      });
    } else if (stock <= 2) {
      notificaciones.push({
        id: `stock-low-${p.id}`,
        tipo: 'stock_bajo',
        titulo: 'Stock Crítico',
        mensaje: `"${nombre}" tiene únicamente ${stock} unidades en existencia.`,
        etiqueta: 'Atención',
        prioridad: 'media',
        accion: 'inventario',
        link: '/productos'
      });
    }
  });

  // 3. Notificaciones de Cobro (Préstamos, Ventas a Crédito y Cuentas por Cobrar)
  // Consumo estricto de la misma fuente de verdad (cobroNotificationService)
  const cobrosNotifs = obtenerNotificacionesCobro({ prestamos, pedidos, pagos });
  cobrosNotifs.forEach((cn) => {
    notificaciones.push({
      id: cn.id,
      tipo: `cobro_${cn.vencimiento}`, // 'cobro_atrasado' | 'cobro_hoy' | 'cobro_manana'
      titulo: cn.vencimiento === 'atrasado'
        ? 'Cobro Atrasado'
        : (cn.vencimiento === 'hoy' ? 'Cuota Vence Hoy' : 'Cuota Vence Mañana'),
      mensaje: `${cn.clienteNombre} • ${cn.concepto} (${cn.montoCobroFormateado})`,
      etiqueta: cn.vencimiento === 'atrasado' ? 'Atrasado' : (cn.vencimiento === 'hoy' ? 'Hoy' : 'Mañana'),
      prioridad: cn.vencimiento === 'atrasado' ? 'critica' : (cn.vencimiento === 'hoy' ? 'alta' : 'media'),
      accion: 'whatsapp_cobro',
      linkWhatsApp: cn.linkWhatsApp,
      telefono: cn.telefono,
      clienteNombre: cn.clienteNombre,
      montoCobro: cn.montoCobro,
      montoCobroFormateado: cn.montoCobroFormateado,
      concepto: cn.concepto,
      origen: cn.origen,
      origenTexto: cn.origenTexto,
      vencimiento: cn.vencimiento,
      link: cn.origen === 'prestamo' ? '/prestamos' : (cn.origen === 'venta_credito' ? '/ventas' : '/pagos')
    });
  });

  return notificaciones;
}
