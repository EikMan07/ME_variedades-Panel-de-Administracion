/**
 * Servicio de Notificaciones y Alertas Inteligentes
 * Plataforma ME Variedades — Soporte en Tiempo Real y WhatsApp (CallMeBot)
 */

import { supabase } from './supabase.js';
import { obtenerNotificacionesCobro } from './cobroNotificationService.js';

// Modo 100% Silencioso o compatible con sonido web audio
export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/campanita-dos-tonos.wav');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {
    // Silencio si no hay contexto de audio disponible
  }
}

/**
 * Consulta la tabla persistente `notificaciones` en Supabase
 */
export async function obtenerNotificacionesRemotas() {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('Advertencia al consultar notificaciones en Supabase:', error.message);
      return [];
    }

    return (data || []).map((n) => ({
      id: `remote-${n.id}`,
      dbId: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      leida: Boolean(n.leida),
      metadata: n.metadata || {},
      created_at: n.created_at,
      linkWhatsApp: n.metadata?.link_whatsapp,
      telefono: n.metadata?.telefono,
      clienteNombre: n.metadata?.cliente_nombre,
      prioridad: n.tipo === 'stock_agotado' ? 'critica' : (n.tipo === 'stock_bajo' ? 'alta' : 'media'),
      etiqueta: n.tipo === 'cumpleanos' ? 'Cumpleaños' : (n.tipo === 'venta' ? 'Venta' : (n.tipo === 'pago' ? 'Abono' : 'Sistema')),
      accion: n.metadata?.link_whatsapp ? 'whatsapp' : (n.tipo === 'stock_bajo' ? 'inventario' : 'general'),
      link: n.tipo.startsWith('stock') ? '/productos' : (n.tipo === 'venta' ? '/ventas' : (n.tipo === 'pago' ? '/pagos' : '/clientes')),
    }));
  } catch (err) {
    console.error('Error en obtenerNotificacionesRemotas:', err);
    return [];
  }
}

/**
 * Marca una notificación como leída en Supabase
 */
export async function marcarNotificacionLeidaRemota(dbId) {
  if (!dbId) return;
  try {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', dbId);
  } catch (err) {
    console.error('Error al marcar leída en Supabase:', err);
  }
}

/**
 * Marca todas las notificaciones como leídas en Supabase
 */
export async function marcarTodasLeidasRemotas() {
  try {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('leida', false);
  } catch (err) {
    console.error('Error al marcar todas leídas en Supabase:', err);
  }
}

/**
 * Elimina una notificación específica de Supabase
 */
export async function eliminarNotificacionRemota(dbId) {
  if (!dbId) return;
  try {
    await supabase
      .from('notificaciones')
      .delete()
      .eq('id', dbId);
  } catch (err) {
    console.error('Error al eliminar notificación en Supabase:', err);
  }
}

/**
 * Elimina todas las notificaciones archivadas (leídas) de Supabase
 */
export async function vaciarHistorialRemoto() {
  try {
    await supabase
      .from('notificaciones')
      .delete()
      .eq('leida', true);
  } catch (err) {
    console.error('Error al vaciar historial en Supabase:', err);
  }
}

/**
 * Dispara una alerta hacia el endpoint serverless /api/whatsapp-notify (CallMeBot)
 */
export async function enviarAlertaWhatsAppAdmin({ titulo, mensaje, tipo = 'prueba' }) {
  try {
    const res = await fetch('/api/whatsapp-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ titulo, mensaje, tipo }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.details || data.error || 'Error al despachar alerta a WhatsApp.');
    }
    return data;
  } catch (err) {
    console.error('Fallo al enviar alerta a WhatsApp:', err);
    throw err;
  }
}

// Generador de alertas inteligentes a partir de datos vivos en memoria
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
      const telLimpio = (c.telefono || '').replace(/\D/g, '');
      const telConPais = telLimpio.length === 8 ? `506${telLimpio}` : telLimpio;
      const linkDirecto = `https://wa.me/${telConPais}?text=${encodeURIComponent(`¡Hola ${nombre}! En ME Variedades te deseamos un muy feliz cumpleaños 🎉🎂 Esperamos que pases un día maravilloso.`)}`;

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
        linkWhatsApp: linkDirecto,
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
