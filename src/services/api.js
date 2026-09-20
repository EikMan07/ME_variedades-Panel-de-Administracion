import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabase.js';
import { comprimirImagen } from './imageCompression.js';

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
 * Normalizador seguro para objetos de Pedidos (Ventas).
 */
export function normalizarPedido(p) {
  if (!p) return p;
  const tot = Number(p.total !== undefined && p.total !== null ? p.total : (p.precio_venta_real || p.costo_total)) || 0;
  const fecha = p.created_at || p.fecha_registro || new Date().toISOString();
  const cuotas = Array.isArray(p.cuotas) ? p.cuotas : [];
  const tipoPlazo = p.tipo_plazo || p.tipoPlazo || null;
  const numPlazos = p.num_plazos !== undefined && p.num_plazos !== null
    ? Number(p.num_plazos)
    : (p.numPlazos ? Number(p.numPlazos) : (cuotas.length > 0 ? cuotas.length : null));
  const modalidad = (p.modalidad || (cuotas.length > 0 ? 'credito' : 'contado')).toLowerCase();
  const cantidad = Number(p.cantidad) || 1;
  const precioFacturacion = p.precio_facturacion !== undefined && p.precio_facturacion !== null
    ? Number(p.precio_facturacion)
    : (p.precioFacturacion !== undefined ? Number(p.precioFacturacion) : null);
  const precioVentaReal = p.precio_venta_real !== undefined && p.precio_venta_real !== null
    ? Number(p.precio_venta_real)
    : (p.precioVentaReal !== undefined ? Number(p.precioVentaReal) : (tot > 0 && cantidad > 0 ? Math.round(tot / cantidad) : tot));

  return {
    ...p,
    id: Number(p.id),
    cliente_id: Number(p.cliente_id),
    producto_id: Number(p.producto_id),
    cantidad: cantidad,
    total: tot,
    costo_total: p.costo_total !== undefined ? Number(p.costo_total) : tot,
    modalidad: modalidad,
    tipo_venta: modalidad === 'credito' ? 'Crédito' : 'Contado',
    precio_facturacion: precioFacturacion,
    precio_venta_real: precioVentaReal,
    tipo_plazo: tipoPlazo,
    num_plazos: numPlazos,
    cuotas: cuotas,
    moratoria_tipo: p.moratoria_tipo || 'semana',
    moratoria_monto: Number(p.moratoria_monto || 0),
    fecha_registro: fecha,
    fecha_venta: p.fecha_venta || fecha.split('T')[0],
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
 * Crear un nuevo pedido en Supabase con soporte completo para ventas a crédito y cuotas.
 */
export async function createPedido(pedidoData) {
  console.log('📤 Creando pedido en Supabase:', pedidoData);
  const cantidad = Number(pedidoData.cantidad) || 1;
  const clienteId = Number(pedidoData.cliente_id || pedidoData.clienteId);
  const productoId = Number(pedidoData.producto_id || pedidoData.productoId);

  let total = Number(pedidoData.total !== undefined ? pedidoData.total : (pedidoData.precio_venta_real || pedidoData.precioVentaReal || pedidoData.costo_total)) || 0;
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

  const cuotas = Array.isArray(pedidoData.cuotas) ? pedidoData.cuotas : [];
  const tipoPlazo = pedidoData.tipo_plazo || pedidoData.tipoPlazo || null;
  const numPlazos = pedidoData.num_plazos !== undefined && pedidoData.num_plazos !== null
    ? Number(pedidoData.num_plazos)
    : (pedidoData.numPlazos ? Number(pedidoData.numPlazos) : (cuotas.length > 0 ? cuotas.length : null));
  const modalidad = (pedidoData.modalidad || (cuotas.length > 0 ? 'credito' : 'contado')).toLowerCase();
  const precioFacturacion = pedidoData.precio_facturacion !== undefined && pedidoData.precio_facturacion !== null
    ? Number(pedidoData.precio_facturacion)
    : (pedidoData.precioFacturacion !== undefined ? Number(pedidoData.precioFacturacion) : null);
  const precioVentaReal = pedidoData.precio_venta_real !== undefined && pedidoData.precio_venta_real !== null
    ? Number(pedidoData.precio_venta_real)
    : (pedidoData.precioVentaReal !== undefined ? Number(pedidoData.precioVentaReal) : (total > 0 && cantidad > 0 ? Math.round(total / cantidad) : total));

  const payload = {
    cliente_id: clienteId,
    producto_id: productoId,
    cantidad: cantidad,
    total: total,
    estado: pedidoData.estado || 'Activo',
    cuotas: cuotas,
    tipo_plazo: tipoPlazo,
    num_plazos: numPlazos,
    modalidad: modalidad,
    precio_facturacion: precioFacturacion,
    precio_venta_real: precioVentaReal,
    moratoria_tipo: pedidoData.moratoria_tipo || pedidoData.moratoriaTipo || 'semana',
    moratoria_monto: Number(pedidoData.moratoria_monto !== undefined ? pedidoData.moratoria_monto : (pedidoData.moratoriaMonto || 0))
  };

  let data, error;
  const res1 = await supabase
    .from('pedidos')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono),
      productos (id, nombre, costo)
    `);

  data = res1.data;
  error = res1.error;

  // Fallback si la migración de moratoria aún no se ha corrido en Supabase
  if (error && error.message && error.message.includes('moratoria')) {
    console.warn('⚠️ Columna moratoria no detectada en Supabase pedidos, reintentando sin campos de moratoria:', error.message);
    const payloadFallback = { ...payload };
    delete payloadFallback.moratoria_tipo;
    delete payloadFallback.moratoria_monto;
    const res2 = await supabase
      .from('pedidos')
      .insert([payloadFallback])
      .select(`
        *,
        clientes (id, nombre_completo, telefono),
        productos (id, nombre, costo)
      `);
    data = res2.data;
    error = res2.error;
  }

  if (error) {
    console.error('❌ Error al crear pedido en Supabase:', error);
    throw error;
  }

  const pedidoGuardado = data && data.length > 0 ? data[0] : payload;
  console.log('🎉 Pedido guardado exitosamente en Supabase:', pedidoGuardado);
  return normalizarPedido({ ...payload, ...pedidoGuardado });
}

/**
 * Actualizar un pedido existente en Supabase.
 */
export async function updatePedido(id, pedidoData) {
  console.log(`📤 Actualizando pedido #${id} en Supabase:`, pedidoData);
  const payload = {};

  const clienteId = pedidoData.cliente_id || pedidoData.clienteId;
  if (clienteId !== undefined && clienteId !== null) {
    payload.cliente_id = Number(clienteId);
  }

  const productoId = pedidoData.producto_id || pedidoData.productoId;
  if (productoId !== undefined && productoId !== null) {
    payload.producto_id = Number(productoId);
  }

  if (pedidoData.cantidad !== undefined && pedidoData.cantidad !== null) {
    payload.cantidad = Number(pedidoData.cantidad);
  }

  if (pedidoData.total !== undefined && pedidoData.total !== null) {
    payload.total = Number(pedidoData.total);
  }

  if (pedidoData.estado !== undefined && pedidoData.estado !== null) {
    payload.estado = pedidoData.estado;
  }

  if (pedidoData.cuotas !== undefined) {
    payload.cuotas = Array.isArray(pedidoData.cuotas) ? pedidoData.cuotas : [];
  }

  if (pedidoData.tipo_plazo !== undefined || pedidoData.tipoPlazo !== undefined) {
    payload.tipo_plazo = pedidoData.tipo_plazo || pedidoData.tipoPlazo || null;
  }

  if (pedidoData.num_plazos !== undefined || pedidoData.numPlazos !== undefined) {
    const np = pedidoData.num_plazos !== undefined ? pedidoData.num_plazos : pedidoData.numPlazos;
    payload.num_plazos = np !== null ? Number(np) : null;
  }

  if (pedidoData.modalidad !== undefined && pedidoData.modalidad !== null) {
    payload.modalidad = String(pedidoData.modalidad).toLowerCase();
  }

  if (pedidoData.precio_facturacion !== undefined || pedidoData.precioFacturacion !== undefined) {
    const pf = pedidoData.precio_facturacion !== undefined ? pedidoData.precio_facturacion : pedidoData.precioFacturacion;
    payload.precio_facturacion = pf !== null ? Number(pf) : null;
  }

  if (pedidoData.precio_venta_real !== undefined || pedidoData.precioVentaReal !== undefined) {
    const pvr = pedidoData.precio_venta_real !== undefined ? pedidoData.precio_venta_real : pedidoData.precioVentaReal;
    payload.precio_venta_real = pvr !== null ? Number(pvr) : null;
  }

  if (pedidoData.moratoria_tipo !== undefined || pedidoData.moratoriaTipo !== undefined) {
    payload.moratoria_tipo = pedidoData.moratoria_tipo || pedidoData.moratoriaTipo || 'semana';
  }

  if (pedidoData.moratoria_monto !== undefined || pedidoData.moratoriaMonto !== undefined) {
    const mm = pedidoData.moratoria_monto !== undefined ? pedidoData.moratoria_monto : pedidoData.moratoriaMonto;
    payload.moratoria_monto = mm !== null ? Number(mm) : 0;
  }

  let data, error;
  const resUpdate1 = await supabase
    .from('pedidos')
    .update(payload)
    .eq('id', Number(id))
    .select(`
      *,
      clientes (id, nombre_completo, telefono),
      productos (id, nombre, costo)
    `);

  data = resUpdate1.data;
  error = resUpdate1.error;

  if (error && error.message && error.message.includes('moratoria')) {
    console.warn('⚠️ Reintentando updatePedido sin columnas de moratoria:', error.message);
    const payloadFallback = { ...payload };
    delete payloadFallback.moratoria_tipo;
    delete payloadFallback.moratoria_monto;
    const resUpdate2 = await supabase
      .from('pedidos')
      .update(payloadFallback)
      .eq('id', Number(id))
      .select(`
        *,
        clientes (id, nombre_completo, telefono),
        productos (id, nombre, costo)
      `);
    data = resUpdate2.data;
    error = resUpdate2.error;
  }

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
  const referenciaVenta = p.venta_asociada || p.pedido_asociado || '';

  return {
    ...p,
    id: Number(p.id),
    cliente_id: Number(p.cliente_id),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    clientes: clienteObj,
    concepto: p.concepto || '',
    tipo_pago: p.tipo_pago ? String(p.tipo_pago) : 'No especificado',
    pedido_asociado: referenciaVenta,
    venta_asociada: referenciaVenta,
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
  console.log('📤 Creando pago/cuenta en Supabase:', pagoData);
  const montoTotal = Number(pagoData.monto_total) || 0;
  const referenciaVenta = pagoData.venta_asociada || pagoData.pedido_asociado || null;
  const payload = {
    cliente_id: Number(pagoData.cliente_id),
    concepto: (pagoData.concepto || '').trim(),
    pedido_asociado: referenciaVenta,
    monto_total: montoTotal,
    monto_pagado: 0,
    saldo_pendiente: montoTotal,
    fecha_acordada: pagoData.fecha_acordada || null,
    tipo_pago: pagoData.tipo_pago || null,
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
  const result = normalizarPago(data && data.length > 0 ? data[0] : payload);
  return result;
}

/**
 * Actualizar un pago/cuenta por cobrar existente en Supabase.
 */
export async function updatePago(id, pagoData) {
  console.log(`📤 Actualizando pago #${id} en Supabase:`, pagoData);
  const payload = {};

  if (pagoData.cliente_id !== undefined && pagoData.cliente_id !== null) {
    payload.cliente_id = Number(pagoData.cliente_id);
  }
  if (pagoData.concepto !== undefined && pagoData.concepto !== null) {
    payload.concepto = String(pagoData.concepto).trim();
  }
  if (pagoData.pedido_asociado !== undefined || pagoData.venta_asociada !== undefined) {
    payload.pedido_asociado = pagoData.pedido_asociado || pagoData.venta_asociada || null;
  }
  if (pagoData.monto_total !== undefined && pagoData.monto_total !== null) {
    payload.monto_total = Number(pagoData.monto_total);
  }
  if (pagoData.monto_pagado !== undefined && pagoData.monto_pagado !== null) {
    payload.monto_pagado = Number(pagoData.monto_pagado);
  }
  if (pagoData.saldo_pendiente !== undefined && pagoData.saldo_pendiente !== null) {
    payload.saldo_pendiente = Number(pagoData.saldo_pendiente);
  }
  if (pagoData.fecha_acordada !== undefined) {
    payload.fecha_acordada = pagoData.fecha_acordada || null;
  }
  if (pagoData.tipo_pago !== undefined) {
    payload.tipo_pago = pagoData.tipo_pago || null;
  }
  if (pagoData.estado !== undefined && pagoData.estado !== null) {
    payload.estado = pagoData.estado;
  }
  if (pagoData.abonos !== undefined) {
    payload.abonos = Array.isArray(pagoData.abonos) ? pagoData.abonos : [];
  }

  const { data, error } = await supabase
    .from('pagos')
    .update(payload)
    .eq('id', Number(id))
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  if (error) {
    console.error(`❌ Error al actualizar pago #${id} en Supabase:`, error);
    throw error;
  }

  const pagoActualizado = data && data.length > 0 ? data[0] : { id, ...payload };
  console.log(`✅ Pago #${id} actualizado exitosamente:`, pagoActualizado);
  return normalizarPago(pagoActualizado);
}

/**
 * Eliminar un pago/cuenta por cobrar en Supabase.
 */
export async function deletePago(id) {
  console.log(`🗑️ Eliminando pago #${id} en Supabase...`);
  const { error } = await supabase
    .from('pagos')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error(`❌ Error al eliminar pago #${id} en Supabase:`, error);
    throw error;
  }
  console.log(`✅ Pago #${id} eliminado de Supabase`);
  return { success: true };
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

  const cuotas = Array.isArray(pr.cuotas) ? pr.cuotas : [];
  const tipoPlazo = pr.tipo_plazo || null;
  const numPlazos = pr.num_plazos !== undefined && pr.num_plazos !== null
    ? Number(pr.num_plazos)
    : (cuotas.length > 0 ? cuotas.length : null);

  // Frecuencia de pago legible: si existe tipo_plazo o frecuencia_pago previa, respetarla
  let frecuencia = tipoPlazo || pr.frecuencia_pago || null;
  if (!frecuencia) {
    if (numPlazos === 1) frecuencia = 'Pago único';
    else if (numPlazos > 1) frecuencia = `${numPlazos} cuotas`;
    else frecuencia = 'No especificado';
  }

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
    tipo_plazo: tipoPlazo,
    num_plazos: numPlazos,
    cuotas: cuotas,
    moratoria_tipo: pr.moratoria_tipo || 'semana',
    moratoria_monto: Number(pr.moratoria_monto || 0),
    frecuencia_pago: frecuencia,
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
 * Crear nuevo préstamo en Supabase con soporte completo para cuotas y plazos.
 */
export async function createPrestamo(prestamoData) {
  const capital = Number(prestamoData.monto_capital) || 0;
  const tasa = Number(prestamoData.tasa_interes) || 0;
  const totalDevolver = capital + (capital * (tasa / 100));

  const cuotas = Array.isArray(prestamoData.cuotas) ? prestamoData.cuotas : [];
  const tipoPlazo = prestamoData.tipo_plazo || null;
  const numPlazos = prestamoData.num_plazos !== undefined && prestamoData.num_plazos !== null
    ? Number(prestamoData.num_plazos)
    : (cuotas.length > 0 ? cuotas.length : 1);

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
    abonos: [],
    cuotas: cuotas,
    tipo_plazo: tipoPlazo,
    num_plazos: numPlazos,
    moratoria_tipo: prestamoData.moratoria_tipo || 'semana',
    moratoria_monto: Number(prestamoData.moratoria_monto || 0)
  };

  let data, error;
  const resPrestamo1 = await supabase
    .from('prestamos')
    .insert([payload])
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  data = resPrestamo1.data;
  error = resPrestamo1.error;

  if (error && error.message && error.message.includes('moratoria')) {
    console.warn('⚠️ Columna moratoria no detectada en Supabase prestamos, reintentando sin campos de moratoria:', error.message);
    const payloadFallback = { ...payload };
    delete payloadFallback.moratoria_tipo;
    delete payloadFallback.moratoria_monto;
    const resPrestamo2 = await supabase
      .from('prestamos')
      .insert([payloadFallback])
      .select(`
        *,
        clientes (id, nombre_completo, telefono)
      `);
    data = resPrestamo2.data;
    error = resPrestamo2.error;
  }

  if (error) {
    console.error('❌ Error al crear préstamo en Supabase:', error);
    throw error;
  }
  return normalizarPrestamo(data && data.length > 0 ? data[0] : payload);
}

/**
 * Actualizar préstamo existente en Supabase.
 */
export async function updatePrestamo(id, prestamoData) {
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
    fecha_entrega: prestamoData.fecha_entrega,
    fecha_limite: prestamoData.fecha_limite,
    tipo_plazo: prestamoData.tipo_plazo || null,
    num_plazos: prestamoData.num_plazos !== undefined && prestamoData.num_plazos !== null ? Number(prestamoData.num_plazos) : null,
    cuotas: Array.isArray(prestamoData.cuotas) ? prestamoData.cuotas : [],
    moratoria_tipo: prestamoData.moratoria_tipo || 'semana',
    moratoria_monto: Number(prestamoData.moratoria_monto || 0)
  };

  if (prestamoData.saldo_pendiente !== undefined) {
    payload.saldo_pendiente = Number(prestamoData.saldo_pendiente);
  }

  let data, error;
  const resUpdateP1 = await supabase
    .from('prestamos')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      clientes (id, nombre_completo, telefono)
    `);

  data = resUpdateP1.data;
  error = resUpdateP1.error;

  if (error && error.message && error.message.includes('moratoria')) {
    console.warn('⚠️ Reintentando updatePrestamo sin columnas de moratoria:', error.message);
    const payloadFallback = { ...payload };
    delete payloadFallback.moratoria_tipo;
    delete payloadFallback.moratoria_monto;
    const resUpdateP2 = await supabase
      .from('prestamos')
      .update(payloadFallback)
      .eq('id', id)
      .select(`
        *,
        clientes (id, nombre_completo, telefono)
      `);
    data = resUpdateP2.data;
    error = resUpdateP2.error;
  }

  if (error) {
    console.error('❌ Error al actualizar préstamo en Supabase:', error);
    throw error;
  }
  return normalizarPrestamo(data && data.length > 0 ? data[0] : null);
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

    // Cálculos agregados
    const saldoCuentasCobrar = (listaPagos || []).reduce(
      (acc, p) => acc + (parseFloat(p.saldo_pendiente) || 0),
      0
    );
    const cuentasPorCobrarCount = (listaPagos || []).filter(
      p => (parseFloat(p.saldo_pendiente) || 0) > 0 || p.estado === 'pendiente' || p.estado === 'proximo' || p.estado === 'vencido'
    ).length;

    const saldoPrestamosCobrar = (listaPrestamos || []).reduce(
      (acc, p) => acc + (parseFloat(p.saldo_pendiente) || 0),
      0
    );
    const prestamosActivosCount = (listaPrestamos || []).filter(
      p => p.estado !== 'liquidado' && ((parseFloat(p.saldo_pendiente) || 0) > 0 || p.estado === 'al_dia' || p.estado === 'proximo' || p.estado === 'atrasado')
    ).length;

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

    return {
      totalClientes: totalClientes !== null && totalClientes !== undefined ? totalClientes : (listaClientes || []).length,
      pedidosActivos: pedidosPendientesCount > 0 ? pedidosPendientesCount : (listaPedidos || []).length,
      cuentasPorCobrarCount: cuentasPorCobrarCount,
      cuentasPorCobrar: cuentasPorCobrarCount,
      totalPorCobrar: cuentasPorCobrarCount,
      totalPorCobrarMonto: saldoCuentasCobrar,
      prestamosActivos: prestamosActivosCount,
      prestamosActivosCount: prestamosActivosCount,
      saldoPrestamosPorRecuperar: saldoPrestamosCobrar,
      totalStockUnidades: totalStockUnidades,
      valorInventario: valorInventario,
      cumpleanerosDelMes: cumpleaneros || (listaClientes || []).filter(c => Number(c.mes_cumpleanos) === mesActual),
      listaClientes: listaClientes || [],
      listaPedidos: (listaPedidos || []).map(normalizarPedido),
      listaPagos: (listaPagos || []).map(normalizarPago),
      listaPrestamos: (listaPrestamos || []).map(normalizarPrestamo),
      listaProductos: listaProductos || [],
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
  ajustarStock: adjustStock,
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
  updatePago,
  deletePago,
  registrarAbono,
  // Préstamos
  getPrestamos,
  createPrestamo,
  updatePrestamo,
  registrarAbonoPrestamo,
  deletePrestamo,
  // Dashboard
  getDashboardMetrics,
};

export default api;
