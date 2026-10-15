import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfygdgyyuxcdaffhkowr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizarPrestamo(pr) {
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
    frecuencia_pago: frecuencia,
    estado: pr.estado || (saldo <= 0 ? 'liquidado' : 'al_dia'),
    abonos: Array.isArray(pr.abonos) ? pr.abonos : []
  };
}

function calcularEstadoPrestamo(prestamo) {
  if (!prestamo) return 'al_dia';
  const saldo = Number(prestamo.saldo_pendiente) || 0;
  if (saldo <= 0) return 'liquidado';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (Array.isArray(prestamo.cuotas) && prestamo.cuotas.length > 0) {
    let saldoAbonosRestante = (prestamo.abonos || []).reduce((sum, a) => sum + (Number(a.monto) || 0), 0);

    for (const c of prestamo.cuotas) {
      const montoCuota = Number(c.montoRealAcordado ?? c.monto ?? c.montoSugerido) || 0;

      if (saldoAbonosRestante >= montoCuota) {
        saldoAbonosRestante -= montoCuota;
        continue;
      }

      const fechaVencStr = c.fechaVencimiento || c.fecha;
      if (!fechaVencStr) continue;

      const fechaVenc = new Date(fechaVencStr + 'T00:00:00');
      if (fechaVenc < hoy) return 'atrasado';

      const diffMs = fechaVenc - hoy;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDias <= 3) return 'proximo';

      return 'al_dia';
    }
  }

  if (!prestamo.fecha_limite) return 'al_dia';
  const fechaLimite = new Date(prestamo.fecha_limite + 'T00:00:00');
  if (fechaLimite < hoy) return 'atrasado';
  const diffMs = fechaLimite - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias <= 3) return 'proximo';

  return 'al_dia';
}

async function runTest() {
  console.log('--- 1. INSERTAR PRÉSTAMO CON CRONOGRAMA COMPLETO ---');
  const payload = {
    nombre_tercero: 'AUDITORIA_TEST_CRONOGRAMA',
    telefono: '88888888',
    monto_capital: 100000,
    tasa_interes: 10,
    total_devolver: 110000,
    saldo_pendiente: 110000,
    fecha_entrega: '2026-09-06',
    fecha_limite: '2026-10-06',
    estado: 'al_dia',
    abonos: [],
    cuotas: [
      { numeroCuota: 1, fechaVencimiento: '2026-09-21', montoSugerido: 55000, montoRealAcordado: 55000, editadoManualmente: false },
      { numeroCuota: 2, fechaVencimiento: '2026-10-06', montoSugerido: 55000, montoRealAcordado: 55000, editadoManualmente: false }
    ],
    tipo_plazo: 'quincena',
    num_plazos: 2
  };

  const { data: inserted, error: insertError } = await supabase.from('prestamos').insert([payload]).select().single();
  if (insertError) {
    console.error('Error al insertar:', insertError);
    return;
  }
  console.log('Insertado con ID:', inserted.id);

  console.log('--- 2. CONSULTAR Y NORMALIZAR (SIMULAR RECARGA) ---');
  const { data: fetched, error: fetchError } = await supabase.from('prestamos').select('*').eq('id', inserted.id).single();
  if (fetchError) {
    console.error('Error al consultar:', fetchError);
    return;
  }

  const norm = normalizarPrestamo(fetched);
  console.log('Resultado tras normalizar:', {
    id: norm.id,
    tipo_plazo: norm.tipo_plazo,
    num_plazos: norm.num_plazos,
    cuotas_count: norm.cuotas.length,
    frecuencia_pago: norm.frecuencia_pago,
    estado: calcularEstadoPrestamo(norm)
  });

  console.log('Detalle de cuotas recuperadas intactas:');
  console.log(JSON.stringify(norm.cuotas, null, 2));

  console.log('--- 3. VERIFICACIÓN DE SEMÁFORO CON ABONOS PARCIALES ---');
  // Prueba 3.1: Abono de 20,000 en cuota 1 futura (vence 21 sep) -> debe ser 'al_dia'
  const conAbono20k = { ...norm, abonos: [{ id: 1, monto: 20000, fecha: '2026-09-07' }] };
  console.log('Prueba 3.1 (Abono parcial de 20k en cuota futura):', calcularEstadoPrestamo(conAbono20k));

  // Prueba 3.2: Cuota 1 vencida (ayer) y con abono parcial de 20k -> debe ser 'atrasado'
  const conCuotaVencidaParcial = {
    ...norm,
    cuotas: [
      { numeroCuota: 1, fechaVencimiento: '2026-09-05', montoRealAcordado: 55000 },
      { numeroCuota: 2, fechaVencimiento: '2026-10-06', montoRealAcordado: 55000 }
    ],
    abonos: [{ id: 1, monto: 20000, fecha: '2026-09-05' }]
  };
  console.log('Prueba 3.2 (Cuota 1 vencida con abono parcial):', calcularEstadoPrestamo(conCuotaVencidaParcial));

  // Prueba 3.3: Cuota 1 vencida cubierta al 100% (55k) y Cuota 2 vence en 2 días (2026-09-08) -> debe ser 'proximo'
  const conCuota1CubiertaYCuota2Proxima = {
    ...norm,
    cuotas: [
      { numeroCuota: 1, fechaVencimiento: '2026-09-05', montoRealAcordado: 55000 },
      { numeroCuota: 2, fechaVencimiento: '2026-09-08', montoRealAcordado: 55000 }
    ],
    abonos: [{ id: 1, monto: 55000, fecha: '2026-09-05' }]
  };
  console.log('Prueba 3.3 (Cuota 1 cubierta al 100%, Cuota 2 vence en 2 días):', calcularEstadoPrestamo(conCuota1CubiertaYCuota2Proxima));

  // Prueba 3.4: Saldo pendiente <= 0 -> debe ser 'liquidado'
  const liquidado = {
    ...norm,
    saldo_pendiente: 0,
    abonos: [{ id: 1, monto: 110000, fecha: '2026-09-06' }]
  };
  console.log('Prueba 3.4 (Totalmente pagado):', calcularEstadoPrestamo(liquidado));

  console.log('--- 4. LIMPIEZA DE REGISTRO TEMPORAL ---');
  const { error: delError } = await supabase.from('prestamos').delete().eq('id', inserted.id);
  console.log('Eliminación registro prueba:', delError ? delError.message : 'OK - Limpio');
}

runTest();
