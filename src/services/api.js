import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabase';
import { comprimirImagen } from './imageCompression';

/**
 * SERVICIO CENTRALIZADO DE API (SUPABASE CLIENT & CRUD)
 * ME VARIEDADES — PLATAFORMA DE ADMINISTRACIÓN
 */

export const NOMBRES_MESES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getMesNumero(mes) {
  if (mes === null || mes === undefined || mes === '') return null;
  if (typeof mes === 'number') {
    return Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : null;
  }
  const parsed = parseInt(mes, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
    return parsed;
  }
  const mesStr = String(mes).toLowerCase().trim();
  const index = NOMBRES_MESES.findIndex((m) => m && m.toLowerCase() === mesStr);
  return index > 0 ? index : null;
}

export function getMesNombre(mes) {
  if (!mes && mes !== 0) return '';
  const num = getMesNumero(mes);
  if (num && NOMBRES_MESES[num]) return NOMBRES_MESES[num];
  return String(mes);
}

export function normalizarEstadoParaSupabase(estado) {
  if (!estado) return 'al_dia';
  const est = String(estado).toLowerCase().trim();
  if (est.includes('saldo') || est === 'con_saldo') return 'con_saldo';
  if (est.includes('prestamo') || est.includes('préstamo') || est === 'atrasado') return 'atrasado';
  return 'al_dia';
}

export function normalizarCliente(c) {
  if (!c) return c;
  const diaInt = parseInt(c.dia_cumpleanos || c.dia_cumple || c.dia, 10);
  const dia = !isNaN(diaInt) && diaInt >= 1 && diaInt <= 31 ? diaInt : null;

  const mesNum = getMesNumero(c.mes_cumpleanos || c.mes_cumple || c.mes);

  return {
    ...c,
    id: Number(c.id),
    nombre_completo: c.nombre_completo || c.nombre || '',
    telefono: c.telefono || '',
    dia_cumple: dia,
    dia_cumpleanos: dia,
    mes_cumple: mesNum,
    mes_cumpleanos: mesNum,
    estado_cuenta: c.estado_cuenta || 'al_dia',
    pedidos_activos: Number(c.pedidos_activos) || 0,
    saldo_pendiente: Number(c.saldo_pendiente) || 0,
    prestamos_abiertos: Number(c.prestamos_abiertos) || 0,
  };
}

// ==============================================================================
// 1. MÓDULO: CLIENTES (CRUD & REGLA RF-15)
// ==============================================================================

/**
 * Obtener todos los clientes desde Supabase.
 */
export async function getClientes() {
  console.log('🔄 Consultando clientes desde Supabase...');
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error getClientes:', error.message, error.details || error);
    throw error;
  }
  console.log('✅ Clientes obtenidos de Supabase:', data);
  return (data || []).map(normalizarCliente);
}

/**
 * Crear un nuevo cliente en Supabase (Mapeo estricto a las columnas de la BD).
 */
export async function createCliente(clienteData) {
  console.log('📤 Preparando datos para Supabase:', clienteData);

  const dia = clienteData.dia_cumpleanos
    ? parseInt(clienteData.dia_cumpleanos, 10)
    : clienteData.dia_cumple
    ? parseInt(clienteData.dia_cumple, 10)
    : parseInt(clienteData.dia, 10);

  const mes = clienteData.mes_cumpleanos
    ? getMesNumero(clienteData.mes_cumpleanos)
    : clienteData.mes_cumple
    ? getMesNumero(clienteData.mes_cumple)
    : getMesNumero(clienteData.mes);

  const payload = {
    nombre_completo: String(clienteData.nombre_completo || clienteData.nombre || '').trim(),
    telefono: String(clienteData.telefono || '').trim(),
    dia_cumpleanos: !isNaN(dia) && dia > 0 && dia <= 31 ? dia : null,
    mes_cumpleanos: !isNaN(mes) && mes > 0 && mes <= 12 ? mes : null,
    estado_cuenta: normalizarEstadoParaSupabase(clienteData.estado_cuenta),
  };

  console.log('📦 Payload validado a insertar en Supabase:', payload);

  const { data, error } = await supabase
    .from('clientes')
    .insert([payload])
    .select();

  if (error) {
    console.error('❌ Error Supabase createCliente:', error.message, error.details, error.hint);
    throw new Error(error.message || 'Error al registrar cliente');
  }

  if (!data || data.length === 0) {
    console.error('❌ Supabase no retornó datos después de la inserción.');
    throw new Error('Supabase no retornó datos tras insertar el cliente.');
  }

  console.log('✅ Cliente insertado con éxito en Supabase:', data[0]);
  return normalizarCliente(data[0]);
}

/**
 * Actualizar un cliente existente en Supabase.
 */
export async function updateCliente(id, clienteData) {
  console.log(`📝 Actualizando cliente ID ${id} en Supabase:`, clienteData);

  const dia = clienteData.dia_cumpleanos
    ? parseInt(clienteData.dia_cumpleanos, 10)
    : clienteData.dia_cumple
    ? parseInt(clienteData.dia_cumple, 10)
    : parseInt(clienteData.dia, 10);

  const mes = clienteData.mes_cumpleanos
    ? getMesNumero(clienteData.mes_cumpleanos)
    : clienteData.mes_cumple
    ? getMesNumero(clienteData.mes_cumple)
    : getMesNumero(clienteData.mes);

  const payload = {
    nombre_completo: String(clienteData.nombre_completo || clienteData.nombre || '').trim(),
    telefono: String(clienteData.telefono || '').trim(),
    dia_cumpleanos: !isNaN(dia) && dia > 0 && dia <= 31 ? dia : null,
    mes_cumpleanos: !isNaN(mes) && mes > 0 && mes <= 12 ? mes : null,
    estado_cuenta: normalizarEstadoParaSupabase(clienteData.estado_cuenta),
  };

  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    return createCliente(clienteData);
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', numId)
    .select();

  if (error) {
    console.error('❌ Error updateCliente en Supabase:', error.message, error.details || error);
    throw new Error(error.message || 'Error al actualizar cliente');
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️ Cliente con ID ${id} no existía en Supabase. Registrándolo en base de datos remota...`);
    return createCliente({ ...payload, ...clienteData });
  }

  console.log('✅ Cliente actualizado exitosamente en Supabase:', data[0]);
  return normalizarCliente(data[0]);
}

/**
 * REGLA DE NEGOCIO RF-15:
 * Validar si el cliente tiene actividad activa antes de eliminar.
 */
export async function verificarEliminacionCliente(clienteId) {
  const id = Number(clienteId);
  const motivos = [];

  // 1. Consultar pedidos activos
  const { data: pedidos, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, estado')
    .eq('cliente_id', id)
    .eq('estado', 'Activo');

  if (!errPedidos && pedidos && pedidos.length > 0) {
    motivos.push(`Tiene ${pedidos.length} pedido(s) activo(s) en proceso.`);
  }

  // 2. Consultar pagos con saldo pendiente
  const { data: pagos, error: errPagos } = await supabase
    .from('pagos')
    .select('id, saldo_pendiente')
    .eq('cliente_id', id)
    .gt('saldo_pendiente', 0);

  if (!errPagos && pagos && pagos.length > 0) {
    const totalSaldo = pagos.reduce((sum, p) => sum + Number(p.saldo_pendiente), 0);
    motivos.push(`Mantiene un saldo pendiente de ₡${totalSaldo.toLocaleString('es-CR')} en cuentas por cobrar.`);
  }

  // 3. Consultar préstamos activos
  const { data: prestamos, error: errPrestamos } = await supabase
    .from('prestamos')
    .select('id, saldo_pendiente, estado')
    .eq('cliente_id', id)
    .neq('estado', 'liquidado');

  if (!errPrestamos && prestamos && prestamos.length > 0) {
    motivos.push(`Registra ${prestamos.length} préstamo(s) activo(s) con saldo pendiente.`);
  }

  return {
    puede: motivos.length === 0,
    motivos
  };
}

/**
 * Eliminar cliente de Supabase (con validación RF-15).
 */
export async function deleteCliente(id) {
  console.log(`🗑️ Eliminando cliente ID ${id} de Supabase...`);
  const verificacion = await verificarEliminacionCliente(id);
  if (!verificacion.puede) {
    return { success: false, bloqueado: true, motivos: verificacion.motivos };
  }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('❌ Error deleteCliente en Supabase:', error.message, error.details || error);
    throw error;
  }
  console.log(`✅ Cliente ID ${id} eliminado exitosamente de Supabase.`);
  return { success: true };
}

// ==============================================================================
// 2. MÓDULO: PRODUCTOS & INVENTARIO
// ==============================================================================

/**
 * Obtener listado de productos en catálogo.
 */
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error al obtener productos de Supabase:', error);
    throw error;
  }
  return data || [];
}

/**
 * Crear nuevo producto en inventario.
 */
export async function createProducto(productoData) {
  const payload = {
    nombre: (productoData.nombre || '').trim(),
    tipo: (productoData.tipo || '').toLowerCase(),
    genero: productoData.genero || null,
    costo: Number(productoData.costo) || 0,
    stock: Math.max(0, Number(productoData.stock) || 0),
    imagen_url: productoData.imagen_url || null
  };

  const { data, error } = await supabase
    .from('productos')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error al crear producto en Supabase:', error);
    throw error;
  }
  return data;
}

/**
 * Actualizar producto existente.
 */
export async function updateProducto(id, productoData) {
  const payload = {
    nombre: (productoData.nombre || '').trim(),
    tipo: (productoData.tipo || '').toLowerCase(),
    genero: productoData.genero !== undefined ? productoData.genero : undefined,
    costo: Number(productoData.costo) || 0,
    stock: Math.max(0, Number(productoData.stock) || 0),
    imagen_url: productoData.imagen_url !== undefined ? productoData.imagen_url : undefined
  };

  const { data, error } = await supabase
    .from('productos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar producto en Supabase:', error);
    throw error;
  }
  return data;
}

/**
 * Ajustar stock de producto (+ o -).
 */
export async function adjustStock(id, cambio) {
  const { data: producto, error: fetchErr } = await supabase
    .from('productos')
    .select('stock, nombre')
    .eq('id', id)
    .single();

  if (fetchErr || !producto) {
    throw new Error('Producto no encontrado para ajuste de stock');
  }

  const nuevoStock = Math.max(0, (Number(producto.stock) || 0) + cambio);

  const { data, error } = await supabase
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al ajustar stock en Supabase:', error);
    throw error;
  }
  return { success: true, nuevoStock: data.stock, nombre: data.nombre };
}

/**
 * Eliminar producto del catálogo.
 */
export async function deleteProducto(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar producto de Supabase:', error);
    throw error;
  }
  return { success: true };
}

/**
 * Subir imagen de producto a Supabase Storage con compresión previa en el cliente.
 */
export async function uploadProductoImagen(file) {
  if (!file) return null;

  // Compresión en el cliente: reduce fotos pesadas a < 250 KB
  const fileOptimizado = await comprimirImagen(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
  const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('imagenes-productos')
    .upload(filePath, fileOptimizado, {
      cacheControl: '31536000, immutable',
      upsert: true
    });

  if (uploadError) {
    console.error('Error al subir imagen de producto a Supabase Storage:', uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from('imagenes-productos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

// ==============================================================================
// 3. MÓDULO: PEDIDOS
// ==============================================================================

/**
 * Normalizador seguro para objetos de Pedidos.
 */
export function normalizarPedido(p) {
  if (!p) return p;
  const tot = Number(p.total !== undefined && p.total !== null ? p.total : p.costo_total) || 0;
  const fecha = p.created_at || p.fecha_registro || new Date().toISOString();
  return {
    ...p,
    id: Number(p.id),
    cliente_id: Number(p.cliente_id),
    producto_id: Number(p.producto_id),
    cantidad: Number(p.cantidad) || 1,
    total: tot,
    costo_total: tot,
    fecha_registro: fecha,
    created_at: fecha,
    estado: p.estado || 'Activo',
    clientes: p.clientes || p.cliente || null,
    productos: p.productos || p.producto || null
  };
}

/**
 * Obtener todos los pedidos registrados con datos de cliente y producto.
 */
export async function getPedidos() {
  console.log('🔄 Consultando pedidos desde Supabase...');
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      clientes (id, nombre_completo, telefono),
      productos (id, nombre, costo)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Fallback a select simple de pedidos:', error.message);
    const { data: basicData, error: basicErr } = await supabase
      .from('pedidos')
      .select('*')
      .order('id', { ascending: false });

    if (basicErr) {
      console.error('❌ Error getPedidos:', basicErr);
      throw basicErr;
    }
    return (basicData || []).map(normalizarPedido);
  }

  console.log('✅ Pedidos obtenidos de Supabase:', data);
  return (data || []).map(normalizarPedido);
}

/**
 * Crear un nuevo pedido en Supabase (el trigger descontará el stock en BD).
 */
export async function createPedido(pedidoData) {
  console.log('📤 Creando pedido en Supabase:', pedidoData);
  const cantidad = Number(pedidoData.cantidad) || 1;
  const clienteId = Number(pedidoData.cliente_id);
  const productoId = Number(pedidoData.producto_id);

  // Obtener costo del producto si no viene especificado
  let total = Number(pedidoData.total !== undefined ? pedidoData.total : pedidoData.costo_total) || 0;
  if (!total) {
    const { data: prod } = await supabase
      .from('productos')
      .select('costo, stock')
      .eq('id', productoId)
      .maybeSingle();

    if (prod) {
      if (prod.stock < cantidad) {
        throw new Error('Stock insuficiente para procesar este pedido.');
      }
      total = cantidad * (Number(prod.costo) || 0);
    }
  }

  const payload = {
    cliente_id: clienteId,
    producto_id: productoId,
    cantidad: cantidad,
    total: total,
    estado: pedidoData.estado || 'Activo'
  };

  const { data, error } = await supabase
    .from('pedidos')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono),
      productos (id, nombre, costo)
    `);

  if (error) {
    console.error('❌ Error al crear pedido en Supabase:', error);
    throw error;
  }

  const pedidoGuardado = data && data.length > 0 ? data[0] : payload;
  console.log('🎉 Pedido guardado exitosamente en Supabase:', pedidoGuardado);
  return normalizarPedido(pedidoGuardado);
}

/**
 * Actualizar un pedido existente en Supabase.
 */
export async function updatePedido(id, pedidoData) {
  console.log(`📤 Actualizando pedido #${id} en Supabase:`, pedidoData);
  const cantidad = Number(pedidoData.cantidad) || 1;
  const clienteId = Number(pedidoData.cliente_id);
  const productoId = Number(pedidoData.producto_id);

  let total = Number(pedidoData.total !== undefined ? pedidoData.total : pedidoData.costo_total) || 0;
  if (!total) {
    const { data: prod } = await supabase
      .from('productos')
      .select('costo')
      .eq('id', productoId)
      .maybeSingle();

    if (prod) {
      total = cantidad * (Number(prod.costo) || 0);
    }
  }

  const payload = {
    cliente_id: clienteId,
    producto_id: productoId,
    cantidad: cantidad,
    total: total,
    estado: pedidoData.estado || 'Activo'
  };

  const { data, error } = await supabase
    .from('pedidos')
    .update(payload)
    .eq('id', Number(id))
    .select(`
      *,
      clientes (id, nombre_completo, telefono),
      productos (id, nombre, costo)
    `);

  if (error) {
    console.error(`❌ Error al actualizar pedido #${id} en Supabase:`, error);
    throw error;
  }

  const pedidoActualizado = data && data.length > 0 ? data[0] : { id, ...payload };
  console.log(`✅ Pedido #${id} actualizado exitosamente:`, pedidoActualizado);
  return normalizarPedido(pedidoActualizado);
}

/**
 * Eliminar un pedido en Supabase.
 */
export async function deletePedido(id) {
  console.log(`🗑️ Eliminando pedido #${id} en Supabase...`);
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error(`❌ Error al eliminar pedido #${id} en Supabase:`, error);
    throw error;
  }
  console.log(`✅ Pedido #${id} eliminado de Supabase`);
  return { success: true };
}

// ==============================================================================
// 4. MÓDULO: PAGOS & CUENTAS POR COBRAR
// ==============================================================================

/**
 * Normalizador seguro para registros de Pagos y Cuentas.
 */
export function normalizarPago(p) {
  if (!p) return p;
  const clienteObj = p.clientes || p.cliente || null;
  const nombre = p.cliente_nombre || clienteObj?.nombre_completo || '';
  const tel = p.cliente_telefono || clienteObj?.telefono || '';
  const montoTotal = Number(p.monto_total) || 0;
  const montoPagado = Number(p.monto_pagado) || 0;
  const saldoPendiente = Number(p.saldo_pendiente !== undefined ? p.saldo_pendiente : Math.max(0, montoTotal - montoPagado));

  return {
    ...p,
    id: Number(p.id),
    cliente_id: Number(p.cliente_id),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    clientes: clienteObj,
    concepto: p.concepto || '',
    pedido_asociado: p.pedido_asociado || '',
    monto_total: montoTotal,
    monto_pagado: montoPagado,
    saldo_pendiente: saldoPendiente,
    fecha_acordada: p.fecha_acordada || '',
    fecha_registro: p.created_at || p.fecha_registro || new Date().toISOString().split('T')[0],
    estado: p.estado || (saldoPendiente <= 0 ? 'pagado' : 'pendiente'),
    abonos: Array.isArray(p.abonos) ? p.abonos : []
  };
}

/**
 * Obtener listado de pagos y cuentas por cobrar con relación a clientes.
 */
export async function getPagos() {
  console.log('🔄 Consultando pagos desde Supabase...');
  const { data, error } = await supabase
    .from('pagos')
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Fallback a select básico de pagos:', error.message);
    const { data: basicData, error: basicErr } = await supabase
      .from('pagos')
      .select('*')
      .order('id', { ascending: false });

    if (basicErr) {
      console.error('❌ Error getPagos:', basicErr);
      throw basicErr;
    }
    return (basicData || []).map(normalizarPago);
  }
  return (data || []).map(normalizarPago);
}

/**
 * Crear nuevo registro de pago/cuenta por cobrar.
 */
export async function createPago(pagoData) {
  const montoTotal = Number(pagoData.monto_total) || 0;
  const payload = {
    cliente_id: Number(pagoData.cliente_id),
    concepto: (pagoData.concepto || '').trim(),
    pedido_asociado: pagoData.pedido_asociado || null,
    monto_total: montoTotal,
    monto_pagado: 0,
    saldo_pendiente: montoTotal,
    fecha_acordada: pagoData.fecha_acordada || null,
    estado: pagoData.estado || 'pendiente',
    abonos: []
  };

  const { data, error } = await supabase
    .from('pagos')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al crear pago en Supabase:', error);
    throw error;
  }
  return normalizarPago(data && data.length > 0 ? data[0] : payload);
}

/**
 * Registrar abono a una cuenta por cobrar.
 */
export async function registrarAbono(pagoId, montoAbono, nota = '') {
  const { data: pago, error: fetchErr } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', pagoId)
    .maybeSingle();

  if (fetchErr || !pago) {
    throw new Error('Pago no encontrado para abonar');
  }

  const monto = Number(montoAbono);
  if (monto <= 0) throw new Error('El monto del abono debe ser mayor a 0');
  if (monto > pago.saldo_pendiente) throw new Error('El abono no puede superar el saldo pendiente');

  const abonosActuales = Array.isArray(pago.abonos) ? pago.abonos : [];
  const nuevoAbono = {
    id: abonosActuales.length + 1,
    monto: monto,
    nota: (nota || '').trim(),
    fecha: new Date().toISOString().split('T')[0]
  };

  const nuevosAbonos = [...abonosActuales, nuevoAbono];
  const totalAbonado = nuevosAbonos.reduce((sum, a) => sum + Number(a.monto), 0);
  const nuevoSaldo = Math.max(0, Number(pago.monto_total) - totalAbonado);
  const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : pago.estado;

  const { data, error } = await supabase
    .from('pagos')
    .update({
      abonos: nuevosAbonos,
      monto_pagado: totalAbonado,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado
    })
    .eq('id', pagoId)
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al registrar abono en Supabase:', error);
    throw error;
  }
  return normalizarPago(data && data.length > 0 ? data[0] : null);
}

// ==============================================================================
// 5. MÓDULO: COBROS (HISTORIAL DE RECAUDACIÓN)
// ==============================================================================

/**
 * Normalizador seguro para registros de Cobros.
 */
export function normalizarCobro(c) {
  if (!c) return c;
  const clienteObj = c.clientes || c.cliente || null;
  const nombre = c.cliente_nombre || clienteObj?.nombre_completo || '';
  const tel = c.cliente_telefono || clienteObj?.telefono || '';

  return {
    ...c,
    id: Number(c.id),
    cliente_id: Number(c.cliente_id),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    clientes: clienteObj,
    monto_cobrado: Number(c.monto_cobrado) || 0,
    fecha_cobro: c.fecha_cobro || (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    metodo_pago: c.metodo_pago || c.metodo_cobro || 'Efectivo',
    metodo_cobro: c.metodo_pago || c.metodo_cobro || 'Efectivo',
    numero_recibo: c.numero_recibo || '',
    concepto: c.concepto || ''
  };
}

/**
 * Obtener listado de cobros realizados con relación a clientes.
 */
export async function getCobros() {
  console.log('🔄 Consultando cobros desde Supabase...');
  const { data, error } = await supabase
    .from('cobros')
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Fallback a select básico de cobros:', error.message);
    const { data: basicData, error: basicErr } = await supabase
      .from('cobros')
      .select('*')
      .order('id', { ascending: false });

    if (basicErr) {
      console.error('❌ Error getCobros:', basicErr);
      throw basicErr;
    }
    return (basicData || []).map(normalizarCobro);
  }
  return (data || []).map(normalizarCobro);
}

/**
 * Registrar un nuevo cobro en Supabase.
 */
export async function registrarCobro(cobroData) {
  const payload = {
    cliente_id: Number(cobroData.cliente_id),
    monto_cobrado: Number(cobroData.monto_cobrado) || 0,
    fecha_cobro: cobroData.fecha_cobro || new Date().toISOString().split('T')[0],
    metodo_pago: cobroData.metodo_cobro || cobroData.metodo_pago || 'Efectivo',
    numero_recibo: cobroData.numero_recibo || null,
    concepto: (cobroData.concepto_nota || cobroData.concepto || '').trim()
  };

  const { data, error } = await supabase
    .from('cobros')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al registrar cobro en Supabase:', error);
    throw error;
  }
  return normalizarCobro(data && data.length > 0 ? data[0] : payload);
}

// ==============================================================================
// 6. MÓDULO: PRÉSTAMOS
// ==============================================================================

/**
 * Normalizador seguro para registros de Préstamos.
 */
export function normalizarPrestamo(pr) {
  if (!pr) return pr;
  const clienteObj = pr.clientes || pr.cliente || null;
  const esCliente = Boolean(pr.cliente_id);
  const nombre = pr.beneficiario_nombre || clienteObj?.nombre_completo || pr.nombre_tercero || '';
  const tel = pr.beneficiario_telefono || clienteObj?.telefono || pr.telefono || '';
  const capital = Number(pr.monto_capital) || 0;
  const tasa = Number(pr.tasa_interes) || 0;
  const interes = capital * (tasa / 100);
  const total = Number(pr.total_devolver || pr.monto_total) || (capital + interes);
  const saldo = Number(pr.saldo_pendiente !== undefined ? pr.saldo_pendiente : total);

  return {
    ...pr,
    id: Number(pr.id),
    cliente_id: pr.cliente_id ? Number(pr.cliente_id) : null,
    es_cliente_registrado: esCliente,
    beneficiario_nombre: nombre,
    beneficiario_telefono: tel,
    nombre_tercero: pr.nombre_tercero || (!esCliente ? nombre : ''),
    telefono: pr.telefono || tel,
    monto_capital: capital,
    tasa_interes: tasa,
    monto_interes: interes,
    monto_total: total,
    total_devolver: total,
    saldo_pendiente: saldo,
    fecha_entrega: pr.fecha_entrega || '',
    fecha_limite: pr.fecha_limite || '',
    frecuencia_pago: pr.frecuencia_pago || 'Pago único',
    estado: pr.estado || (saldo <= 0 ? 'liquidado' : 'al_dia'),
    abonos: Array.isArray(pr.abonos) ? pr.abonos : []
  };
}

/**
 * Obtener listado de préstamos con relación a clientes.
 */
export async function getPrestamos() {
  console.log('🔄 Consultando préstamos desde Supabase...');
  const { data, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Fallback a select básico de préstamos:', error.message);
    const { data: basicData, error: basicErr } = await supabase
      .from('prestamos')
      .select('*')
      .order('id', { ascending: false });

    if (basicErr) {
      console.error('❌ Error getPrestamos:', basicErr);
      throw basicErr;
    }
    return (basicData || []).map(normalizarPrestamo);
  }
  return (data || []).map(normalizarPrestamo);
}

/**
 * Crear nuevo préstamo en Supabase.
 */
export async function createPrestamo(prestamoData) {
  const capital = Number(prestamoData.monto_capital) || 0;
  const tasa = Number(prestamoData.tasa_interes) || 0;
  const totalDevolver = capital + (capital * (tasa / 100));

  const payload = {
    cliente_id: prestamoData.cliente_id ? Number(prestamoData.cliente_id) : null,
    nombre_tercero: prestamoData.beneficiario_nombre || prestamoData.nombre_tercero || null,
    telefono: prestamoData.beneficiario_telefono || prestamoData.telefono || null,
    monto_capital: capital,
    tasa_interes: tasa,
    total_devolver: totalDevolver,
    saldo_pendiente: totalDevolver,
    fecha_entrega: prestamoData.fecha_entrega || new Date().toISOString().split('T')[0],
    fecha_limite: prestamoData.fecha_limite,
    estado: 'al_dia',
    abonos: []
  };

  const { data, error } = await supabase
    .from('prestamos')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al crear préstamo en Supabase:', error);
    throw error;
  }
  return normalizarPrestamo(data && data.length > 0 ? data[0] : payload);
}

/**
 * Registrar abono a un préstamo en Supabase.
 */
export async function registrarAbonoPrestamo(prestamoId, montoAbono, nota = '') {
  const { data: prestamo, error: fetchErr } = await supabase
    .from('prestamos')
    .select('*')
    .eq('id', prestamoId)
    .maybeSingle();

  if (fetchErr || !prestamo) {
    throw new Error('Préstamo no encontrado para abonar');
  }

  const monto = Number(montoAbono);
  if (monto <= 0) throw new Error('El monto del abono debe ser mayor a 0');
  if (monto > prestamo.saldo_pendiente) throw new Error('El abono no puede superar el saldo pendiente');

  const abonosActuales = Array.isArray(prestamo.abonos) ? prestamo.abonos : [];
  const nuevoAbono = {
    id: abonosActuales.length + 1,
    monto: monto,
    nota: (nota || '').trim(),
    fecha: new Date().toISOString().split('T')[0]
  };

  const nuevosAbonos = [...abonosActuales, nuevoAbono];
  const totalAbonado = nuevosAbonos.reduce((sum, a) => sum + Number(a.monto), 0);
  const nuevoSaldo = Math.max(0, Number(prestamo.total_devolver) - totalAbonado);
  const nuevoEstado = nuevoSaldo === 0 ? 'liquidado' : prestamo.estado;

  const { data, error } = await supabase
    .from('prestamos')
    .update({
      abonos: nuevosAbonos,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado
    })
    .eq('id', prestamoId)
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al registrar abono a préstamo en Supabase:', error);
    throw error;
  }
  return normalizarPrestamo(data && data.length > 0 ? data[0] : null);
}

/**
 * Eliminar un préstamo en Supabase.
 */
export async function deletePrestamo(id) {
  const numId = Number(id);
  console.log(`🗑️ Eliminando préstamo #${numId} en Supabase...`);
  const { error } = await supabase
    .from('prestamos')
    .delete()
    .eq('id', numId);

  if (error) {
    console.error(`❌ Error al eliminar préstamo #${numId} en Supabase:`, error.message, error.details || error);
    throw error;
  }
  console.log(`✅ Préstamo #${numId} eliminado exitosamente de Supabase`);
  return { success: true };
}

// ==============================================================================
// 7. MÓDULO: FACTURAS & COMPROBANTES (STORAGE + DB)
// ==============================================================================

/**
 * Normalizador seguro para registros de Facturas y Comprobantes.
 */
export function normalizarFactura(f) {
  if (!f) return f;
  const clienteObj = f.clientes || f.cliente || null;
  const nombre = f.cliente_nombre || clienteObj?.nombre_completo || '';
  const tel = f.cliente_telefono || clienteObj?.telefono || '';

  return {
    ...f,
    id: Number(f.id),
    cliente_id: Number(f.cliente_id),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    clientes: clienteObj,
    tipo_categoria: f.tipo_categoria || 'pedidos',
    identificador_ref: f.identificador_ref || f.referencia_id || '',
    referencia_id: f.identificador_ref || f.referencia_id || '',
    archivo_url: f.archivo_url || '',
    archivo_data: f.archivo_url || f.archivo_data || '',
    archivo_nombre: f.archivo_nombre || 'documento_adjunto',
    archivo_tipo: f.archivo_tipo || 'image',
    archivo_size: Number(f.archivo_size) || 0,
    monto: f.monto ? Number(f.monto) : null,
    fecha_emision: f.fecha_emision || (f.created_at ? f.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    notas: f.notas || ''
  };
}

/**
 * Obtener listado de facturas y comprobantes digitalizados con relación a clientes.
 */
export async function getFacturas() {
  console.log('🔄 Consultando facturas desde Supabase...');
  const { data, error } = await supabase
    .from('facturas_comprobantes')
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Fallback a select básico de facturas:', error.message);
    const { data: basicData, error: basicErr } = await supabase
      .from('facturas_comprobantes')
      .select('*')
      .order('id', { ascending: false });

    if (basicErr) {
      console.error('❌ Error getFacturas:', basicErr);
      throw basicErr;
    }
    return (basicData || []).map(normalizarFactura);
  }
  return (data || []).map(normalizarFactura);
}

/**
 * Subir archivo binario a Supabase Storage y guardar registro en facturas_comprobantes.
 */
export async function uploadFactura(fileOrBlob, metadata) {
  let archivoUrl = metadata.archivo_url || '';

  if (fileOrBlob) {
    let fileToUpload = fileOrBlob;

    if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
      const parts = fileOrBlob.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      fileToUpload = new Blob([uInt8Array], { type: contentType });
    }

    if (fileToUpload instanceof Blob || (typeof fileToUpload === 'object' && fileToUpload?.type?.startsWith('image/'))) {
      fileToUpload = await comprimirImagen(fileToUpload, { maxWidth: 1400, maxHeight: 1400, quality: 0.84 });
    }

    const fileExt = metadata.archivo_nombre ? metadata.archivo_nombre.split('.').pop() : 'jpg';
    const fileName = `factura_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes-facturas')
      .upload(filePath, fileToUpload, {
        cacheControl: '31536000, immutable',
        upsert: true
      });

    if (uploadError) {
      console.warn('Advertencia al subir archivo a Storage (usando fallback URL):', uploadError);
      archivoUrl = typeof fileOrBlob === 'string' ? fileOrBlob : '';
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('comprobantes-facturas')
        .getPublicUrl(filePath);
      archivoUrl = publicUrlData.publicUrl;
    }
  }

  const payload = {
    cliente_id: Number(metadata.cliente_id),
    tipo_categoria: metadata.tipo_categoria || 'pedidos',
    identificador_ref: metadata.referencia_id || metadata.identificador_ref || null,
    archivo_url: archivoUrl || '',
    archivo_nombre: metadata.archivo_nombre || 'comprobante_adjunto',
    archivo_tipo: metadata.archivo_tipo || 'image',
    archivo_size: Number(metadata.archivo_size) || 0,
    monto: metadata.monto ? Number(metadata.monto) : null,
    notas: (metadata.notas || '').trim(),
    fecha_emision: metadata.fecha_emision || new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase
    .from('facturas_comprobantes')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error('❌ Error al guardar comprobante en base de datos Supabase:', error);
    throw error;
  }

  return normalizarFactura(data && data.length > 0 ? data[0] : payload);
}

/**
 * Eliminar factura de la base de datos y de Supabase Storage.
 */
export async function deleteFactura(id, archivoUrl = '') {
  console.log(`🗑️ Eliminando factura ID ${id} de Supabase...`);

  // 1. Si no se pasó la URL, intentar consultarla antes de borrar el registro
  let urlStorage = archivoUrl;
  if (!urlStorage) {
    try {
      const { data: facturaRow } = await supabase
        .from('facturas_comprobantes')
        .select('archivo_url')
        .eq('id', Number(id))
        .maybeSingle();

      if (facturaRow?.archivo_url) {
        urlStorage = facturaRow.archivo_url;
      }
    } catch (e) {
      console.warn('No se pudo consultar archivo_url para eliminación previa:', e);
    }
  }

  // 2. Si existe un archivo en Supabase Storage, eliminarlo
  if (urlStorage && (urlStorage.includes('comprobantes-facturas') || urlStorage.includes('supabase.co/storage'))) {
    try {
      let filePath = '';
      if (urlStorage.includes('comprobantes-facturas/')) {
        filePath = urlStorage.split('comprobantes-facturas/')[1];
      } else {
        const urlParts = urlStorage.split('/');
        filePath = urlParts[urlParts.length - 1];
      }

      if (filePath) {
        const cleanPath = decodeURIComponent(filePath.split('?')[0]);
        console.log(`🗑️ Eliminando archivo del bucket comprobantes-facturas: ${cleanPath}`);
        const { error: storageError } = await supabase.storage
          .from('comprobantes-facturas')
          .remove([cleanPath]);

        if (storageError) {
          console.warn('Advertencia al eliminar archivo de storage:', storageError.message);
        } else {
          console.log(`✅ Archivo ${cleanPath} eliminado de Storage.`);
        }
      }
    } catch (e) {
      console.warn('No se pudo procesar la ruta del archivo en storage:', e);
    }
  }

  // 3. Eliminar el registro en la tabla facturas_comprobantes
  const { error } = await supabase
    .from('facturas_comprobantes')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('❌ Error al eliminar factura en Supabase:', error.message);
    throw error;
  }

  console.log(`✅ Factura ID ${id} eliminada correctamente de Supabase.`);
  return { success: true };
}

// ==============================================================================
// 8. MÓDULO: DASHBOARD & MÉTRICAS EN VIVO
// ==============================================================================

/**
 * Obtener métricas agregadas y datos en vivo para el Dashboard Principal desde Supabase.
 */
export async function getDashboardMetrics() {
  console.log('📊 Calculando métricas del Dashboard desde Supabase...');

  try {
    // 1. Conteo total de clientes y lista de clientes
    const { count: totalClientes, data: listaClientes, error: errClientes } = await supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 2. Pedidos activos y lista de pedidos
    const { count: totalPedidos, data: listaPedidos, error: errPedidos } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (id, nombre_completo, telefono),
        productos (id, nombre, costo, imagen_url)
      `)
      .order('created_at', { ascending: false });

    // 3. Cuentas por cobrar y pagos
    const { data: listaPagos, error: errPagos } = await supabase
      .from('pagos')
      .select(`
        *,
        clientes (id, nombre_completo, telefono)
      `)
      .order('created_at', { ascending: false });

    // 4. Préstamos activos y saldo por recuperar
    const { data: listaPrestamos, error: errPrestamos } = await supabase
      .from('prestamos')
      .select(`
        *,
        clientes (id, nombre_completo, telefono)
      `)
      .order('created_at', { ascending: false });

    // 5. Total de unidades en stock y catálogo de productos
    const { data: listaProductos, error: errProd } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });

    // 6. Cumpleañeros del mes actual
    const mesActual = new Date().getMonth() + 1; // 1 a 12
    const { data: cumpleaneros, error: errCumple } = await supabase
      .from('clientes')
      .select('*')
      .eq('mes_cumpleanos', mesActual)
      .order('dia_cumpleanos', { ascending: true });

    // 7. Cobros recientes
    const { data: listaCobros, error: errCobros } = await supabase
      .from('cobros')
      .select(`
        *,
        clientes (id, nombre_completo, telefono)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Cálculos agregados
    const saldoCuentasCobrar = (listaPagos || []).reduce(
      (acc, p) => acc + (parseFloat(p.saldo_pendiente) || 0),
      0
    );
    const saldoPrestamosCobrar = (listaPrestamos || []).reduce(
      (acc, p) => acc + (parseFloat(p.saldo_pendiente) || 0),
      0
    );
    const totalStockUnidades = (listaProductos || []).reduce(
      (acc, p) => acc + (parseInt(p.stock, 10) || 0),
      0
    );
    const valorInventario = (listaProductos || []).reduce(
      (acc, p) => acc + ((parseFloat(p.costo) || 0) * (parseInt(p.stock, 10) || 0)),
      0
    );
    const pedidosPendientesCount = (listaPedidos || []).filter(
      p => p.estado === 'Activo' || p.estado === 'Pendiente' || p.estado === 'en_proceso' || p.estado === 'activo'
    ).length;
    const prestamosActivosCount = (listaPrestamos || []).filter(
      p => p.estado === 'al_dia' || p.estado === 'pendiente' || p.estado === 'Activo' || p.estado === 'activo' || (parseFloat(p.saldo_pendiente) || 0) > 0
    ).length;

    return {
      totalClientes: totalClientes !== null && totalClientes !== undefined ? totalClientes : (listaClientes || []).length,
      pedidosActivos: pedidosPendientesCount > 0 ? pedidosPendientesCount : (listaPedidos || []).length,
      totalPorCobrar: saldoCuentasCobrar,
      prestamosActivos: prestamosActivosCount,
      saldoPrestamosPorRecuperar: saldoPrestamosCobrar,
      totalStockUnidades: totalStockUnidades,
      valorInventario: valorInventario,
      cumpleanerosDelMes: cumpleaneros || (listaClientes || []).filter(c => Number(c.mes_cumpleanos) === mesActual),
      listaClientes: listaClientes || [],
      listaPedidos: (listaPedidos || []).map(normalizarPedido),
      listaPagos: (listaPagos || []).map(normalizarPago),
      listaPrestamos: (listaPrestamos || []).map(normalizarPrestamo),
      listaProductos: listaProductos || [],
      listaCobros: (listaCobros || []).map(normalizarCobro),
    };
  } catch (err) {
    console.error('❌ Error al calcular getDashboardMetrics:', err);
    throw err;
  }
}

// Exportación unificada
export const api = {
  // Clientes
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  verificarEliminacionCliente,
  // Productos
  getProductos,
  createProducto,
  updateProducto,
  adjustStock,
  deleteProducto,
  uploadProductoImagen,
  // Pedidos
  getPedidos,
  createPedido,
  updatePedido,
  deletePedido,
  // Pagos
  getPagos,
  createPago,
  registrarAbono,
  // Cobros
  getCobros,
  registrarCobro,
  // Préstamos
  getPrestamos,
  createPrestamo,
  registrarAbonoPrestamo,
  deletePrestamo,
  // Facturas
  getFacturas,
  uploadFactura,
  deleteFactura,
  // Dashboard
  getDashboardMetrics,
};

export default api;
