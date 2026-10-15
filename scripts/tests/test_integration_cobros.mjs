import { createClient } from '@supabase/supabase-js';
import { obtenerNotificacionesCobro } from '../src/services/cobroNotificationService.js';
import { obtenerFechaLocalISO, extraerComponentesFecha } from '../src/utils/utils.js';

const SUPABASE_URL = 'https://pfygdgyyuxcdaffhkowr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

async function runIntegrationTest() {
  console.log('================================================================');
  console.log('🧪 INICIANDO PRUEBA DE INTEGRACIÓN: NOTIFICACIONES DE COBRO (RF-08, RF-53 a 56)');
  console.log('================================================================\n');

  // 1. Calcular fechas locales de referencia: Ayer, Hoy, Mañana
  const hoyDate = new Date();
  const { anio, mes, dia } = extraerComponentesFecha(hoyDate);
  const ayerDate = new Date(anio, mes, dia - 1, 12, 0, 0);
  const mananaDate = new Date(anio, mes, dia + 1, 12, 0, 0);

  const hoyStr = obtenerFechaLocalISO(hoyDate);
  const ayerStr = obtenerFechaLocalISO(ayerDate);
  const mananaStr = obtenerFechaLocalISO(mananaDate);

  console.log(`Fechas de prueba locales:`);
  console.log(` - Ayer (Atrasado): ${ayerStr}`);
  console.log(` - Hoy (Vence Hoy):  ${hoyStr}`);
  console.log(` - Mañana (Vence Mañana): ${mananaStr}\n`);

  let clienteCreado = null;
  let productoCreado = null;
  let prestamoCreado = null;
  let pedidoCreado = null;
  let pagoCreado = null;

  try {
    // 2. Crear Cliente de Prueba
    console.log('--- 1. CREANDO CLIENTE DE PRUEBA ---');
    const { data: cData, error: cErr } = await supabase
      .from('clientes')
      .insert({
        nombre_completo: '[TEST] Carlos Cobranza Mora',
        telefono: '8888-7777',
        saldo_pendiente: 0,
        estado_cuenta: 'al_dia'
      })
      .select()
      .single();

    if (cErr) throw cErr;
    clienteCreado = cData;
    console.log(`Cliente TEST creado con ID: ${clienteCreado.id}`);

    // 3. Crear Producto de Prueba (para la venta)
    console.log('\n--- 2. CREANDO PRODUCTO DE PRUEBA ---');
    const { data: prodData, error: prodErr } = await supabase
      .from('productos')
      .insert({
        nombre: '[TEST] Zapato Formal Cuero',
        tipo: 'calzado',
        genero: 'unisex',
        costo: 10000,
        stock: 15
      })
      .select()
      .single();

    if (prodErr) throw prodErr;
    productoCreado = prodData;
    console.log(`Producto TEST creado con ID: ${productoCreado.id}`);

    // 4. Escenario 1: Préstamo con Cuota 1 vencida ayer (Atrasado) y Cuota 2 en el futuro (+15 días)
    console.log('\n--- 3. CREANDO ESCENARIO 1: PRÉSTAMO CON CUOTA VENCIDA AYER (ATRASADO) ---');
    const fechaFutura = obtenerFechaLocalISO(new Date(anio, mes, dia + 15, 12, 0, 0));
    const { data: prData, error: prErr } = await supabase
      .from('prestamos')
      .insert({
        cliente_id: clienteCreado.id,
        nombre_tercero: clienteCreado.nombre_completo,
        telefono: clienteCreado.telefono,
        monto_capital: 50000,
        tasa_interes: 0,
        total_devolver: 50000,
        saldo_pendiente: 50000,
        fecha_entrega: ayerStr,
        fecha_limite: fechaFutura,
        tipo_plazo: 'quincena',
        num_plazos: 2,
        cuotas: [
          { numeroCuota: 1, fechaVencimiento: ayerStr, montoRealAcordado: 25000, pagada: false, montoPagado: 0, estado: 'pendiente' },
          { numeroCuota: 2, fechaVencimiento: fechaFutura, montoRealAcordado: 25000, pagada: false, montoPagado: 0, estado: 'pendiente' }
        ],
        estado: 'atrasado',
        abonos: []
      })
      .select()
      .single();

    if (prErr) throw prErr;
    prestamoCreado = prData;
    console.log(`Préstamo TEST creado con ID: ${prestamoCreado.id}`);

    // 5. Escenario 2: Venta a Crédito con Cuota que vence HOY
    console.log('\n--- 4. CREANDO ESCENARIO 2: VENTA A CRÉDITO CON CUOTA QUE VENCE HOY ---');
    const { data: pedData, error: pedErr } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteCreado.id,
        producto_id: productoCreado.id,
        cantidad: 1,
        total: 30000,
        precio_facturacion: 30000,
        precio_venta_real: 30000,
        modalidad: 'credito',
        tipo_plazo: 'mes',
        num_plazos: 1,
        cuotas: [
          { numeroCuota: 1, fechaVencimiento: hoyStr, montoRealAcordado: 30000, pagada: false, montoPagado: 0, estado: 'pendiente' }
        ],
        estado: 'Activo'
      })
      .select()
      .single();

    if (pedErr) throw pedErr;
    pedidoCreado = pedData;
    console.log(`Pedido/Venta a Crédito TEST creado con ID: ${pedidoCreado.id}`);

    // 6. Escenario 3: Cuenta por Cobrar (Pagos) con vencimiento programado para MAÑANA
    console.log('\n--- 5. CREANDO ESCENARIO 3: CUENTA POR COBRAR QUE VENCE MAÑANA ---');
    const { data: pagData, error: pagErr } = await supabase
      .from('pagos')
      .insert({
        cliente_id: clienteCreado.id,
        concepto: '[TEST] Cobro saldo pendiente mercadería',
        monto_total: 15000,
        monto_pagado: 0,
        saldo_pendiente: 15000,
        tipo_pago: 'quincenal',
        fecha_acordada: mananaStr,
        estado: 'pendiente',
        abonos: []
      })
      .select()
      .single();

    if (pagErr) throw pagErr;
    pagoCreado = pagData;
    console.log(`Cuenta por Cobrar (Pago) TEST creada con ID: ${pagoCreado.id}`);

    // 7. Simular lectura viva del Dashboard desde Supabase
    console.log('\n--- 6. CONSULTANDO DATOS REALES EN SUPABASE (TAL COMO HACE EL DASHBOARD) ---');
    const { data: dbPrestamos } = await supabase
      .from('prestamos')
      .select('*, clientes(id, nombre_completo, telefono)')
      .eq('id', prestamoCreado.id);

    const { data: dbPedidos } = await supabase
      .from('pedidos')
      .select('*, clientes(id, nombre_completo, telefono)')
      .eq('id', pedidoCreado.id);

    const { data: dbPagos } = await supabase
      .from('pagos')
      .select('*, clientes(id, nombre_completo, telefono)')
      .eq('id', pagoCreado.id);

    // 8. Procesar con el motor central cobroNotificationService
    console.log('\n--- 7. EVALUANDO NOTIFICACIONES CON cobroNotificationService ---');
    const notificaciones = obtenerNotificacionesCobro({
      prestamos: dbPrestamos,
      pedidos: dbPedidos,
      pagos: dbPagos,
      fechaReferencia: hoyDate
    });

    console.log(`Total de notificaciones detectadas: ${notificaciones.length}`);
    console.log(JSON.stringify(notificaciones, null, 2));

    // 9. Validar Asertos
    assert(notificaciones.length === 3, 'Se deben generar exactamente 3 notificaciones para los 3 escenarios');

    // Validación Escenario 1: Atrasado
    const notifAtrasada = notificaciones.find(n => n.vencimiento === 'atrasado');
    assert(Boolean(notifAtrasada), 'Debe existir una notificación clasificada como "atrasado"');
    assert(notifAtrasada.origen === 'prestamo', 'La notificación atrasada proviene de "prestamo"');
    assert(notifAtrasada.clienteNombre === '[TEST] Carlos Cobranza Mora', 'El nombre del cliente coincide');
    assert(notifAtrasada.montoCobro === 25000, 'El monto exigible de la cuota 1 es 25,000');
    assert(notifAtrasada.montoCobroFormateado === '₡25,000.00', 'El monto formateado es ₡25,000.00');
    assert(notifAtrasada.fechaVencimiento === ayerStr, `La fecha de vencimiento es ayer (${ayerStr})`);
    assert(notifAtrasada.linkWhatsApp.includes('https://wa.me/50688887777'), 'El enlace de WhatsApp contiene el número saneado (+50688887777)');
    assert(decodeURIComponent(notifAtrasada.linkWhatsApp).includes('pendiente'), 'El mensaje de WhatsApp indica cuota pendiente atrasada');

    // Validación Escenario 2: Hoy
    const notifHoy = notificaciones.find(n => n.vencimiento === 'hoy');
    assert(Boolean(notifHoy), 'Debe existir una notificación clasificada como "hoy"');
    assert(notifHoy.origen === 'venta_credito', 'La notificación de hoy proviene de "venta_credito"');
    assert(notifHoy.montoCobro === 30000, 'El monto exigible de la venta a crédito es 30,000');
    assert(notifHoy.montoCobroFormateado === '₡30,000.00', 'El monto formateado es ₡30,000.00');
    assert(notifHoy.fechaVencimiento === hoyStr, `La fecha de vencimiento es hoy (${hoyStr})`);
    assert(notifHoy.linkWhatsApp.includes('https://wa.me/50688887777'), 'El enlace de WhatsApp contiene el número saneado (+50688887777)');
    assert(decodeURIComponent(notifHoy.linkWhatsApp).includes('el día de hoy vence'), 'El mensaje de WhatsApp indica que vence hoy');

    // Validación Escenario 3: Mañana
    const notifManana = notificaciones.find(n => n.vencimiento === 'manana');
    assert(Boolean(notifManana), 'Debe existir una notificación clasificada como "manana"');
    assert(notifManana.origen === 'cuenta_cobrar', 'La notificación de mañana proviene de "cuenta_cobrar"');
    assert(notifManana.montoCobro === 15000, 'El monto exigible de la cuenta por cobrar es 15,000');
    assert(notifManana.montoCobroFormateado === '₡15,000.00', 'El monto formateado es ₡15,000.00');
    assert(notifManana.fechaVencimiento === mananaStr, `La fecha de vencimiento es mañana (${mananaStr})`);
    assert(notifManana.linkWhatsApp.includes('https://wa.me/50688887777'), 'El enlace de WhatsApp contiene el número saneado (+50688887777)');
    assert(decodeURIComponent(notifManana.linkWhatsApp).includes('el día de mañana vence'), 'El mensaje de WhatsApp indica que vence mañana');

    console.log('\n🎉 ¡TODAS LAS VALIDACIONES DE LÓGICA Y NEGOCIO PASARON EXITOSAMENTE!');

  } finally {
    // 10. LIMPIEZA TOTAL DE REGISTROS DE PRUEBA
    console.log('\n--- 8. LIMPIEZA ABSOLUTA DE REGISTROS DE PRUEBA (SUPABASE) ---');

    if (prestamoCreado) {
      const { error: dPrErr } = await supabase.from('prestamos').delete().eq('id', prestamoCreado.id);
      console.log(`Eliminación Préstamo TEST #${prestamoCreado.id}:`, dPrErr ? dPrErr.message : 'OK');
    }

    if (pedidoCreado) {
      const { error: dPedErr } = await supabase.from('pedidos').delete().eq('id', pedidoCreado.id);
      console.log(`Eliminación Pedido/Venta TEST #${pedidoCreado.id}:`, dPedErr ? dPedErr.message : 'OK');
    }

    if (pagoCreado) {
      const { error: dPagErr } = await supabase.from('pagos').delete().eq('id', pagoCreado.id);
      console.log(`Eliminación Pago TEST #${pagoCreado.id}:`, dPagErr ? dPagErr.message : 'OK');
    }

    if (productoCreado) {
      const { error: dProdErr } = await supabase.from('productos').delete().eq('id', productoCreado.id);
      console.log(`Eliminación Producto TEST #${productoCreado.id}:`, dProdErr ? dProdErr.message : 'OK');
    }

    if (clienteCreado) {
      const { error: dCliErr } = await supabase.from('clientes').delete().eq('id', clienteCreado.id);
      console.log(`Eliminación Cliente TEST #${clienteCreado.id}:`, dCliErr ? dCliErr.message : 'OK');
    }

    // 11. Confirmar estado de las tablas
    const { count: countPedidos } = await supabase.from('pedidos').select('*', { count: 'exact', head: true });
    const { count: countPagos } = await supabase.from('pagos').select('*', { count: 'exact', head: true });
    const { count: countProductos } = await supabase.from('productos').select('*', { count: 'exact', head: true });
    const { count: countPrestamos } = await supabase.from('prestamos').select('*', { count: 'exact', head: true });

    console.log('\n--- 9. VERIFICACIÓN FINAL DE LIMPIEZA DE TABLAS ---');
    console.log(` - pedidos: ${countPedidos} filas (debe ser 0)`);
    console.log(` - pagos: ${countPagos} filas (debe ser 0)`);
    console.log(` - productos creados de prueba eliminados: ${countProductos} productos en catálogo`);
    console.log(` - prestamos remanentes: ${countPrestamos} filas`);

    assert(countPedidos === 0, 'La tabla pedidos quedó en 0 filas');
    assert(countPagos === 0, 'La tabla pagos quedó en 0 filas');
  }
}

runIntegrationTest().catch((err) => {
  console.error('❌ Error general durante la ejecución de la prueba:', err);
  process.exit(1);
});
