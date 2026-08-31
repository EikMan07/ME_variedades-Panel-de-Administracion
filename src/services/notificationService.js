/**
 * Servicio de Notificaciones y Alertas Inteligentes
 * Plataforma ME Variedades
 * Iconografía 100% SVG Vectorial - Sin Emojis
 */

// Modo 100% Silencioso (Sin reproducción de sonidos)
export function playNotificationSound() {
  // Función inerte: todos los efectos de audio han sido suprimidos
}

// Generador de alertas inteligentes a partir de datos reales de Supabase
export function generarNotificaciones({ clientes = [], productos = [], pagos = [], prestamos = [] }) {
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

  // 3. Alertas de Pagos y Cuentas por Cobrar
  pagos.forEach(p => {
    const saldo = parseFloat(p.saldo_pendiente) || 0;
    const fechaRef = p.fecha_acordada || p.fecha_vencimiento || p.fecha_limite;
    const nombreCliente = p.clientes?.nombre_completo || p.cliente_nombre || p.cliente || 'Cliente';

    if (saldo > 0 && fechaRef) {
      const fechaLimite = new Date(fechaRef);
      const diffDias = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));

      if (diffDias < 0) {
        notificaciones.push({
          id: `pago-vencido-${p.id}`,
          tipo: 'pago_vencido',
          titulo: 'Cuenta Vencida',
          mensaje: `Saldo de ${nombreCliente} (₡${saldo.toLocaleString('es-CR')}) con ${Math.abs(diffDias)} días de atraso.`,
          etiqueta: 'Vencido',
          prioridad: 'critica',
          accion: 'finanzas',
          link: '/pagos'
        });
      } else if (diffDias <= 2) {
        notificaciones.push({
          id: `pago-proximo-${p.id}`,
          tipo: 'pago_proximo',
          titulo: 'Pago por Vencer',
          mensaje: `Saldo de ${nombreCliente} (₡${saldo.toLocaleString('es-CR')}) vence ${diffDias === 0 ? 'hoy' : `en ${diffDias} días`}.`,
          etiqueta: 'Por vencer',
          prioridad: 'media',
          accion: 'finanzas',
          link: '/pagos'
        });
      }
    }
  });

  // 4. Alertas de Préstamos
  prestamos.forEach(pr => {
    const saldo = parseFloat(pr.saldo_pendiente) || 0;
    const fechaRef = pr.fecha_limite || pr.fecha_vencimiento || pr.fecha_acordada;
    const nombreBeneficiario = pr.nombre_tercero || pr.clientes?.nombre_completo || pr.cliente_nombre || 'Beneficiario';

    if (saldo > 0 && fechaRef) {
      const fechaLimite = new Date(fechaRef);
      const diffDias = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));

      if (diffDias <= 3 && diffDias >= 0) {
        notificaciones.push({
          id: `prestamo-vence-${pr.id}`,
          tipo: 'prestamo_proximo',
          titulo: 'Vencimiento de Préstamo',
          mensaje: `Préstamo a ${nombreBeneficiario} (₡${saldo.toLocaleString('es-CR')}) vence ${diffDias === 0 ? 'hoy' : `en ${diffDias} días`}.`,
          etiqueta: 'Atención',
          prioridad: 'alta',
          accion: 'prestamos',
          link: '/prestamos'
        });
      } else if (diffDias < 0) {
        notificaciones.push({
          id: `prestamo-vencido-${pr.id}`,
          tipo: 'prestamo_proximo',
          titulo: 'Préstamo Atrasado',
          mensaje: `Préstamo a ${nombreBeneficiario} (₡${saldo.toLocaleString('es-CR')}) con ${Math.abs(diffDias)} días vencido.`,
          etiqueta: 'Vencido',
          prioridad: 'critica',
          accion: 'prestamos',
          link: '/prestamos'
        });
      }
    }
  });

  return notificaciones;
}
