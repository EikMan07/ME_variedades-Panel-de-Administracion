/**
 * ============================================================================
 * MOTOR CENTRAL DE CÁLCULO DE PLAZOS Y CUOTAS — PROYECTO MARÍA (v4.0)
 * ME Variedades — Arquitectura Modular y State Management
 * ============================================================================
 *
 * Módulo centralizado para la proyección matemática de fechas de vencimiento,
 * cálculo de cuotas sugeridas (RNF-08) y formateo financiero / fechas para los
 * módulos de Préstamos y Ventas.
 */

/**
 * Mapeo de días exactos por tipo de plazo según regla de negocio RNF-08.
 * - 'semana': 7 días exactos.
 * - 'quincena': 15 días exactos.
 * - 'mes': 30 días exactos (sin excepciones de calendario fin de mes).
 */
export const DIAS_POR_PLAZO = Object.freeze({
  semana: 7,
  semanas: 7,
  quincena: 15,
  quincenas: 15,
  mes: 30,
  meses: 30,
});

/**
 * Parsea una fecha de entrada asegurando manipulación en componentes locales
 * (año, mes, día) para evitar desfases por zonas horarias (UTC vs Local / Off-by-one).
 *
 * @param {string|Date} fecha - Fecha en formato 'YYYY-MM-DD', ISO string o Date.
 * @returns {{ anio: number, mes: number, dia: number }}
 * @throws {TypeError} Si la fecha es inválida o no parseable.
 */
export function extraerComponentesFecha(fecha) {
  if (!fecha) {
    throw new TypeError('La fecha de inicio es requerida y no puede estar vacía.');
  }

  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) {
      throw new TypeError('La fecha de inicio es un objeto Date inválido.');
    }
    return {
      anio: fecha.getFullYear(),
      mes: fecha.getMonth(), // 0-indexed
      dia: fecha.getDate(),
    };
  }

  if (typeof fecha === 'string') {
    const limpia = fecha.trim();
    if (!limpia) {
      throw new TypeError('La cadena de fecha de inicio no puede ser vacía.');
    }

    // Extracción de YYYY-MM-DD
    const regexISO = /^(\d{4})-(\d{2})-(\d{2})/;
    const match = regexISO.exec(limpia);

    if (match) {
      const anio = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10) - 1; // 0-indexed
      const dia = parseInt(match[3], 10);

      // Validar coherencia numérica básica
      if (anio >= 1900 && anio <= 2100 && mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) {
        return { anio, mes, dia };
      }
    }

    // Fallback con constructor Date
    const d = new Date(limpia);
    if (!isNaN(d.getTime())) {
      return {
        anio: d.getFullYear(),
        mes: d.getMonth(),
        dia: d.getDate(),
      };
    }
  }

  throw new TypeError(
    `La fecha de inicio "${fecha}" no tiene un formato válido. Se espera 'YYYY-MM-DD' o una instancia de Date.`
  );
}

/**
 * Formatea componentes numéricos (año, mes 0-index, día) a formato estándar 'YYYY-MM-DD'.
 *
 * @param {Date} dateObj - Objeto Date del cual extraer año, mes y día locales.
 * @returns {string} Fecha formateada 'YYYY-MM-DD'.
 */
function formatearAFechaISO(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calcula el cronograma de fechas de vencimiento y cuotas sugeridas para préstamos y ventas.
 *
 * Reglas de cálculo (RNF-08):
 * 1. Conteo de días exactos:
 *    - 'semana' = 7 días exactos por cuota.
 *    - 'quincena' = 15 días exactos por cuota.
 *    - 'mes' = 30 días exactos por cuota (sin excepciones de calendario de fin de mes).
 * 2. Cálculo financiero:
 *    - montoSugerido = Math.round((montoTotal / numPlazos) * 100) / 100
 * 3. React-Friendly State:
 *    - Retorna un objeto estructurado e inmutable sin mutaciones en prototipos de array.
 *
 * @param {string|Date} fechaInicio - Fecha de partida del crédito/venta ('YYYY-MM-DD' o Date).
 * @param {'semana'|'quincena'|'mes'} tipoPlazo - Frecuencia de pago.
 * @param {number} numPlazos - Cantidad de cuotas/plazos (debe ser entero > 0).
 * @param {number} montoTotal - Monto total a financiar o prestar (debe ser > 0).
 * @returns {{
 *   cuotas: Array<{ numeroCuota: number, fechaVencimiento: string, montoSugerido: number }>,
 *   fechaFinal: string,
 *   montoSugerido: number,
 *   montoTotal: number,
 *   numPlazos: number,
 *   tipoPlazo: string
 * }}
 * @throws {RangeError|TypeError|Error} Si alguno de los parámetros no cumple las validaciones.
 */
export function calcularFechasYCuotas(fechaInicio, tipoPlazo, numPlazos, montoTotal) {
  // 1. Validación de numPlazos
  const plazos = Number(numPlazos);
  if (!Number.isInteger(plazos) || plazos <= 0) {
    throw new RangeError(
      `El número de plazos debe ser un número entero mayor a 0. Valor recibido: ${numPlazos}`
    );
  }

  // 2. Validación de montoTotal
  const total = Number(montoTotal);
  if (typeof total !== 'number' || isNaN(total) || total <= 0) {
    throw new RangeError(
      `El monto total debe ser un valor numérico positivo mayor a 0. Valor recibido: ${montoTotal}`
    );
  }

  // 3. Validación y normalización de tipoPlazo
  if (!tipoPlazo || typeof tipoPlazo !== 'string') {
    throw new TypeError(
      'El tipo de plazo es obligatorio y debe ser una cadena ("semana", "quincena", "mes").'
    );
  }

  const plazoNormalizado = tipoPlazo.trim().toLowerCase();
  const diasPorCuota = DIAS_POR_PLAZO[plazoNormalizado];

  if (!diasPorCuota) {
    throw new Error(
      `El tipo de plazo "${tipoPlazo}" no es válido. Opciones permitidas: 'semana', 'quincena', 'mes'.`
    );
  }

  // 4. Extracción segura de componentes de fecha (evita desfase UTC)
  const { anio, mes, dia } = extraerComponentesFecha(fechaInicio);

  // 5. Cálculo del monto sugerido con redondeo a 2 decimales
  const montoSugerido = Math.round((total / plazos) * 100) / 100;

  // 6. Proyección secuencial de cuotas sumando días exactos
  const cuotas = [];

  for (let i = 1; i <= plazos; i++) {
    const diasASumar = i * diasPorCuota;
    // Usamos el mediodía (12:00) para evitar cualquier salto accidental de cambio de hora (DST)
    const fechaCalculada = new Date(anio, mes, dia + diasASumar, 12, 0, 0, 0);
    const fechaVencimiento = formatearAFechaISO(fechaCalculada);

    cuotas.push({
      numeroCuota: i,
      fechaVencimiento,
      montoSugerido,
    });
  }

  const fechaFinal = cuotas[cuotas.length - 1].fechaVencimiento;

  // 7. Retorno en estructura limpia e inmutable para React
  return {
    cuotas,
    fechaFinal,
    montoSugerido,
    montoTotal: total,
    numPlazos: plazos,
    tipoPlazo: plazoNormalizado,
  };
}

/**
 * Formatea un valor numérico a moneda costarricense (CRC) con separadores de miles y 2 decimales.
 *
 * @param {number|string} monto - Monto numérico a formatear.
 * @param {boolean} [incluirSimbolo=true] - Si se debe anteponer el símbolo ₡.
 * @returns {string} Monto formateado (ej. "₡25,000.00").
 */
export function formatearMoneda(monto, incluirSimbolo = true) {
  const valor = Number(monto) || 0;
  const partes = Math.abs(valor).toFixed(2).split('.');
  const enteros = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimales = partes[1];
  const signo = valor < 0 ? '-' : '';
  const resultado = `${signo}${enteros}.${decimales}`;

  return incluirSimbolo ? `₡${resultado}` : resultado;
}

/**
 * Formatea una fecha ('YYYY-MM-DD' o Date) a formato legible en español sin desfases de zona horaria.
 *
 * @param {string|Date} fecha - Fecha a formatear.
 * @param {'corto'|'largo'} [formato='corto'] - 'corto' ('DD/MM/YYYY') o 'largo' ('D de mes de YYYY').
 * @returns {string} Fecha formateada.
 */
export function formatearFecha(fecha, formato = 'corto') {
  if (!fecha) return '';
  try {
    const { anio, mes, dia } = extraerComponentesFecha(fecha);
    const diaPad = String(dia).padStart(2, '0');
    const mesPad = String(mes + 1).padStart(2, '0');

    if (formato === 'corto') {
      return `${diaPad}/${mesPad}/${anio}`;
    }

    const mesesNombres = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${dia} de ${mesesNombres[mes]} de ${anio}`;
  } catch {
    return String(fecha);
  }
}

/**
 * Convierte una fecha a formato estándar 'YYYY-MM-DD' en tiempo local seguro.
 *
 * @param {string|Date} [fecha=new Date()] - Fecha a formatear.
 * @returns {string} Fecha en formato ISO local 'YYYY-MM-DD'.
 */
export function obtenerFechaLocalISO(fecha = new Date()) {
  const { anio, mes, dia } = extraerComponentesFecha(fecha);
  const mm = String(mes + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/**
 * Genera un enlace directo a WhatsApp (wa.me) para Costa Rica (+506).
 * Limpia cualquier caracter no numérico y antepone el código de país '506' si no está presente.
 *
 * @param {string|number} telefono - Número de teléfono del cliente.
 * @param {string} [mensaje=''] - Mensaje a pre-cargar en el chat.
 * @returns {string} URL formateada para WhatsApp o '#' si el teléfono es inválido.
 */
export function generarLinkWhatsApp(telefono, mensaje = '') {
  if (!telefono) return '#';
  const soloDigitos = String(telefono).replace(/\D/g, '');
  if (!soloDigitos) return '#';

  const numeroCompleto = soloDigitos.startsWith('506') && soloDigitos.length > 8
    ? soloDigitos
    : (soloDigitos.length === 8 ? `506${soloDigitos}` : (soloDigitos.startsWith('506') ? soloDigitos : `506${soloDigitos}`));

  const textoEncoded = mensaje ? encodeURIComponent(mensaje) : '';
  return textoEncoded
    ? `https://wa.me/${numeroCompleto}?text=${textoEncoded}`
    : `https://wa.me/${numeroCompleto}`;
}

/**
 * Determina si una fecha corresponde exactamente al día de hoy (tiempo local).
 *
 * @param {string|Date} fecha - Fecha a evaluar ('YYYY-MM-DD' o Date).
 * @param {Date} [fechaReferencia=new Date()] - Fecha base de comparación.
 * @returns {boolean}
 */
export function esHoy(fecha, fechaReferencia = new Date()) {
  if (!fecha) return false;
  try {
    const fComp = extraerComponentesFecha(fecha);
    const refComp = extraerComponentesFecha(fechaReferencia);
    return fComp.anio === refComp.anio && fComp.mes === refComp.mes && fComp.dia === refComp.dia;
  } catch {
    return false;
  }
}

/**
 * Determina si una fecha corresponde exactamente al día de mañana (+1 día local).
 *
 * @param {string|Date} fecha - Fecha a evaluar ('YYYY-MM-DD' o Date).
 * @param {Date} [fechaReferencia=new Date()] - Fecha base de comparación.
 * @returns {boolean}
 */
export function esManana(fecha, fechaReferencia = new Date()) {
  if (!fecha) return false;
  try {
    const fComp = extraerComponentesFecha(fecha);
    const refComp = extraerComponentesFecha(fechaReferencia);
    const mananaDate = new Date(refComp.anio, refComp.mes, refComp.dia + 1, 12, 0, 0);
    const mComp = extraerComponentesFecha(mananaDate);
    return fComp.anio === mComp.anio && fComp.mes === mComp.mes && fComp.dia === mComp.dia;
  } catch {
    return false;
  }
}

/**
 * Determina si una fecha es anterior a la fecha de hoy (tiempo local), es decir, atrasada/vencida.
 *
 * @param {string|Date} fecha - Fecha a evaluar ('YYYY-MM-DD' o Date).
 * @param {Date} [fechaReferencia=new Date()] - Fecha base de comparación.
 * @returns {boolean}
 */
export function esAtrasada(fecha, fechaReferencia = new Date()) {
  if (!fecha) return false;
  try {
    const fComp = extraerComponentesFecha(fecha);
    const refComp = extraerComponentesFecha(fechaReferencia);
    const fechaEvaluada = new Date(fComp.anio, fComp.mes, fComp.dia, 0, 0, 0);
    const fechaRef = new Date(refComp.anio, refComp.mes, refComp.dia, 0, 0, 0);
    return fechaEvaluada < fechaRef;
  } catch {
    return false;
  }
}

/**
 * Clasifica una fecha de vencimiento respecto a la fecha actual:
 * 'atrasado' | 'hoy' | 'manana' | 'futuro'
 *
 * @param {string|Date} fecha - Fecha de vencimiento.
 * @param {Date} [fechaReferencia=new Date()] - Fecha base de comparación.
 * @returns {'atrasado'|'hoy'|'manana'|'futuro'|null}
 */
export function clasificarFechaVencimiento(fecha, fechaReferencia = new Date()) {
  if (!fecha) return null;
  if (esAtrasada(fecha, fechaReferencia)) return 'atrasado';
  if (esHoy(fecha, fechaReferencia)) return 'hoy';
  if (esManana(fecha, fechaReferencia)) return 'manana';
  return 'futuro';
}

/**
 * ============================================================================
 * MOTOR DE MORATORIA POR ATRASO (RNF-08)
 * ME Variedades — Préstamos y Ventas a Crédito
 * ============================================================================
 *
 * Días exactos por cada tipo de período de moratoria:
 * - 'dia': 1 día exacto.
 * - 'semana': 7 días exactos.
 * - 'mes': 30 días exactos (regla RNF-08).
 * - 'quincena': 15 días exactos.
 */
export const DIAS_POR_PERIODO_MORA = Object.freeze({
  dia: 1,
  dias: 1,
  diario: 1,
  semana: 7,
  semanas: 7,
  semanal: 7,
  mes: 30,
  meses: 30,
  mensual: 30,
  quincena: 15,
  quincenas: 15,
  quincenal: 15,
});

/**
 * Calcula la moratoria correspondiente a una cuota o vencimiento individual.
 *
 * @param {string|Date} fechaVencimiento - Fecha en que venció la cuota.
 * @param {'dia'|'semana'|'mes'} [moratoriaTipo='semana'] - Tipo de período de mora.
 * @param {number} [moratoriaMonto=0] - Monto fijo en colones por período de atraso completo.
 * @param {Date} [fechaReferencia=new Date()] - Fecha actual de evaluación (para pruebas y tiempo local seguro).
 * @returns {{
 *   diasAtraso: number,
 *   periodosCompletos: number,
 *   montoMora: number,
 *   moratoriaTipo: string,
 *   moratoriaMonto: number
 * }}
 */
export function calcularMoratoriaCuota(
  fechaVencimiento,
  moratoriaTipo = 'semana',
  moratoriaMonto = 0,
  fechaReferencia = new Date()
) {
  const monto = Number(moratoriaMonto) || 0;
  const tipo = String(moratoriaTipo || 'semana').trim().toLowerCase();
  const diasPeriodo = DIAS_POR_PERIODO_MORA[tipo] || 7;

  if (!fechaVencimiento || monto <= 0) {
    return {
      diasAtraso: 0,
      periodosCompletos: 0,
      montoMora: 0,
      moratoriaTipo: tipo,
      moratoriaMonto: monto,
    };
  }

  try {
    const fComp = extraerComponentesFecha(fechaVencimiento);
    const refComp = extraerComponentesFecha(fechaReferencia);

    const fechaVencDate = new Date(fComp.anio, fComp.mes, fComp.dia, 0, 0, 0, 0);
    const fechaRefDate = new Date(refComp.anio, refComp.mes, refComp.dia, 0, 0, 0, 0);

    const diffMs = fechaRefDate.getTime() - fechaVencDate.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias <= 0) {
      return {
        diasAtraso: 0,
        periodosCompletos: 0,
        montoMora: 0,
        moratoriaTipo: tipo,
        moratoriaMonto: monto,
      };
    }

    const periodosCompletos = Math.floor(diffDias / diasPeriodo);
    const montoMora = periodosCompletos * monto;

    return {
      diasAtraso: diffDias,
      periodosCompletos,
      montoMora,
      moratoriaTipo: tipo,
      moratoriaMonto: monto,
    };
  } catch {
    return {
      diasAtraso: 0,
      periodosCompletos: 0,
      montoMora: 0,
      moratoriaTipo: tipo,
      moratoriaMonto: monto,
    };
  }
}

/**
 * Calcula la moratoria acumulada y el saldo total exigible para un préstamo o venta a crédito.
 * Soporta de manera unificada Préstamos y Pedidos / Ventas a Crédito (RNF-08).
 *
 * @param {Object} item - Objeto de préstamo o venta a crédito.
 * @param {Date} [fechaReferencia=new Date()] - Fecha base para la evaluación.
 * @returns {{
 *   moraTotal: number,
 *   cuotasConMora: Array<Object>,
 *   diasAtrasoMax: number,
 *   saldoBase: number,
 *   saldoTotalConMora: number,
 *   moratoriaTipo: string,
 *   moratoriaMonto: number
 * }}
 */
export function calcularMoratoriaElemento(item, fechaReferencia = new Date()) {
  if (!item) {
    return {
      moraTotal: 0,
      cuotasConMora: [],
      diasAtrasoMax: 0,
      saldoBase: 0,
      saldoTotalConMora: 0,
      moratoriaTipo: 'semana',
      moratoriaMonto: 0,
    };
  }

  const moratoriaTipo = String(item.moratoria_tipo || item.moratoriaTipo || 'semana').trim().toLowerCase();
  const moratoriaMonto = Number(item.moratoria_monto !== undefined ? item.moratoria_monto : (item.moratoriaMonto || 0));
  const saldoBase = Number(item.saldo_pendiente !== undefined ? item.saldo_pendiente : (item.saldoRestante ?? item.total ?? 0));

  if (moratoriaMonto <= 0 || (item.estado || '').toLowerCase() === 'liquidado' || saldoBase <= 0) {
    return {
      moraTotal: 0,
      cuotasConMora: [],
      diasAtrasoMax: 0,
      saldoBase,
      saldoTotalConMora: saldoBase,
      moratoriaTipo,
      moratoriaMonto,
    };
  }

  let moraTotal = 0;
  let diasAtrasoMax = 0;
  const cuotasConMora = [];

  const cuotas = Array.isArray(item.cuotas) ? item.cuotas : [];

  if (cuotas.length > 0) {
    // Si tiene abonos acumulados (caso Préstamos)
    const tieneAbonos = Array.isArray(item.abonos);
    let saldoAbonosRestante = tieneAbonos
      ? item.abonos.reduce((sum, a) => sum + (Number(a.monto) || 0), 0)
      : 0;

    cuotas.forEach((c, idx) => {
      const numCuota = c.numeroCuota || idx + 1;
      const montoCuota = Number(c.montoRealAcordado !== undefined ? c.montoRealAcordado : (c.montoSugerido || c.monto || 0));

      if (c.pagada === true) return;

      let montoExigible = montoCuota;
      if (tieneAbonos) {
        if (saldoAbonosRestante >= montoCuota && montoCuota > 0) {
          saldoAbonosRestante -= montoCuota;
          return;
        }
        montoExigible = Math.max(0, montoCuota - saldoAbonosRestante);
        saldoAbonosRestante = 0;
      } else {
        const montoPagado = Number(c.montoPagado || 0);
        montoExigible = Math.max(0, montoCuota - montoPagado);
      }

      if (montoExigible <= 0) return;

      const fechaVenc = c.fechaVencimiento || c.fecha;
      if (!fechaVenc) return;

      const resMora = calcularMoratoriaCuota(fechaVenc, moratoriaTipo, moratoriaMonto, fechaReferencia);
      if (resMora.diasAtraso > 0) {
        diasAtrasoMax = Math.max(diasAtrasoMax, resMora.diasAtraso);
      }

      if (resMora.montoMora > 0) {
        moraTotal += resMora.montoMora;
        cuotasConMora.push({
          numeroCuota: numCuota,
          fechaVencimiento: fechaVenc,
          montoBaseExigible: montoExigible,
          diasAtraso: resMora.diasAtraso,
          periodosCompletos: resMora.periodosCompletos,
          montoMora: resMora.montoMora,
          montoTotalExigible: montoExigible + resMora.montoMora,
        });
      }
    });
  } else {
    // Fallback para préstamos antiguos o pago único sin cuotas desglosadas
    const fechaRef = item.fecha_limite || item.fecha_vencimiento || item.fecha_acordada;
    if (fechaRef) {
      const resMora = calcularMoratoriaCuota(fechaRef, moratoriaTipo, moratoriaMonto, fechaReferencia);
      if (resMora.diasAtraso > 0) {
        diasAtrasoMax = Math.max(diasAtrasoMax, resMora.diasAtraso);
      }
      if (resMora.montoMora > 0) {
        moraTotal += resMora.montoMora;
        cuotasConMora.push({
          numeroCuota: 1,
          fechaVencimiento: fechaRef,
          montoBaseExigible: saldoBase,
          diasAtraso: resMora.diasAtraso,
          periodosCompletos: resMora.periodosCompletos,
          montoMora: resMora.montoMora,
          montoTotalExigible: saldoBase + resMora.montoMora,
        });
      }
    }
  }

  return {
    moraTotal,
    cuotasConMora,
    diasAtrasoMax,
    saldoBase,
    saldoTotalConMora: saldoBase + moraTotal,
    moratoriaTipo,
    moratoriaMonto,
  };
}

/**
 * ============================================================================
 * SUITE DE PRUEBAS UNITARIAS DE EJEMPLO
 * ============================================================================
 * Ejecuta validaciones exhaustivas sobre las reglas RNF-08 y casos de prueba requeridos:
 * 1. 2 quincenas desde hoy (+15 y +30 días).
 * 2. 4 semanas (+7, +14, +21, +28 días).
 * 3. 3 meses con conteo estricto de 30 días exactos (ej. 31 de enero).
 * 4. Validaciones de control de errores (numPlazos <= 0, montoTotal <= 0, plazos inválidos).
 */
export function ejecutarPruebasUnitarias() {
  console.log('\n======================================================');
  console.log('🧪 EJECUTANDO PRUEBAS UNITARIAS: utils.js (RNF-08)');
  console.log('======================================================\n');

  let pasadas = 0;
  let total = 0;

  function assert(condicion, descripcion) {
    total++;
    if (condicion) {
      console.log(`  ✅ [PASS] ${descripcion}`);
      pasadas++;
    } else {
      console.error(`  ❌ [FAIL] ${descripcion}`);
    }
  }

  // --- CASO 1: 2 quincenas desde fecha de prueba fija (y desde hoy) ---
  console.log('--- Caso 1: 2 Quincenas (+15 y +30 días exactos) ---');
  const fechaHoy = new Date();
  const hoyISO = formatearAFechaISO(fechaHoy);
  const resQuincenas = calcularFechasYCuotas('2026-09-05', 'quincena', 2, 50000);

  assert(resQuincenas.cuotas.length === 2, 'Retorna exactamente 2 cuotas');
  assert(resQuincenas.cuotas[0].fechaVencimiento === '2026-09-20', 'Cuota 1 vence exactamente a 15 días (2026-09-20)');
  assert(resQuincenas.cuotas[1].fechaVencimiento === '2026-10-05', 'Cuota 2 vence exactamente a 30 días (2026-10-05)');
  assert(resQuincenas.fechaFinal === '2026-10-05', 'fechaFinal coincide con la última cuota (2026-10-05)');
  assert(resQuincenas.montoSugerido === 25000, 'montoSugerido calculado exactamente en 25,000');
  assert(resQuincenas.numPlazos === 2, 'numPlazos coincide con el argumento');
  assert(resQuincenas.montoTotal === 50000, 'montoTotal coincide con el argumento');

  // Prueba dinámica desde hoy
  const resQuincenasHoy = calcularFechasYCuotas(hoyISO, 'quincena', 2, 100000);
  assert(resQuincenasHoy.cuotas.length === 2, `Cálculo con fecha de hoy (${hoyISO}) genera 2 cuotas`);

  // --- CASO 2: 4 semanas (intervalos de 7 días exactos) ---
  console.log('\n--- Caso 2: 4 Semanas (+7, +14, +21, +28 días exactos) ---');
  const resSemanas = calcularFechasYCuotas('2026-03-01', 'semana', 4, 100000);

  assert(resSemanas.cuotas.length === 4, 'Retorna exactamente 4 cuotas');
  assert(resSemanas.cuotas[0].fechaVencimiento === '2026-03-08', 'Semana 1: 2026-03-08 (+7 días)');
  assert(resSemanas.cuotas[1].fechaVencimiento === '2026-03-15', 'Semana 2: 2026-03-15 (+14 días)');
  assert(resSemanas.cuotas[2].fechaVencimiento === '2026-03-22', 'Semana 3: 2026-03-22 (+21 días)');
  assert(resSemanas.cuotas[3].fechaVencimiento === '2026-03-29', 'Semana 4: 2026-03-29 (+28 días)');
  assert(resSemanas.fechaFinal === '2026-03-29', 'fechaFinal es 2026-03-29');
  assert(resSemanas.montoSugerido === 25000, 'montoSugerido es 25,000');

  // --- CASO 3: 3 meses (30 días exactos sin excepciones de fin de mes RNF-08) ---
  console.log('\n--- Caso 3: 3 Meses (+30, +60, +90 días exactos RNF-08) ---');
  // Iniciando el 31 de enero de 2026:
  // +30 días = 2 de marzo (2026 no es bisiesto, feb tiene 28 días -> 31 ene + 28 d feb + 2 d mar = 30 d)
  // +60 días = 1 de abril (marzo tiene 31 días)
  // +90 días = 1 de mayo (abril tiene 30 días)
  const resMeses = calcularFechasYCuotas('2026-01-31', 'mes', 3, 150000);

  assert(resMeses.cuotas.length === 3, 'Retorna exactamente 3 cuotas');
  assert(resMeses.cuotas[0].fechaVencimiento === '2026-03-02', 'Mes 1 (+30 días desde 31-ene) es 2026-03-02');
  assert(resMeses.cuotas[1].fechaVencimiento === '2026-04-01', 'Mes 2 (+60 días desde 31-ene) es 2026-04-01');
  assert(resMeses.cuotas[2].fechaVencimiento === '2026-05-01', 'Mes 3 (+90 días desde 31-ene) es 2026-05-01');
  assert(resMeses.fechaFinal === '2026-05-01', 'fechaFinal es 2026-05-01');
  assert(resMeses.montoSugerido === 50000, 'montoSugerido es 50,000');

  // --- CASO 4: Formato inmutable React-friendly ---
  console.log('\n--- Caso 4: Verificación de Estructura Inmutable (React-Friendly) ---');
  assert(typeof resQuincenas === 'object' && !Array.isArray(resQuincenas), 'Retorna un objeto puro (no array mutado)');
  assert(Array.isArray(resQuincenas.cuotas), 'La propiedad "cuotas" es un Array puro');
  assert(Object.isFrozen(DIAS_POR_PLAZO), 'DIAS_POR_PLAZO está protegido con Object.freeze');

  // --- CASO 5: Funciones Auxiliares de Formato ---
  console.log('\n--- Caso 5: Funciones Auxiliares (Moneda y Fecha) ---');
  assert(formatearMoneda(25000) === '₡25,000.00', 'formatearMoneda formatea ₡25,000.00');
  assert(formatearMoneda(1234567.89) === '₡1,234,567.89', 'formatearMoneda con millones');
  assert(formatearFecha('2026-09-05', 'corto') === '05/09/2026', 'formatearFecha corto: 05/09/2026');
  assert(formatearFecha('2026-09-05', 'largo') === '5 de septiembre de 2026', 'formatearFecha largo: 5 de septiembre de 2026');

  // --- CASO 6: Validaciones de Control de Errores ---
  console.log('\n--- Caso 6: Validaciones de Error Estrictas ---');

  let errorNumPlazos = false;
  try {
    calcularFechasYCuotas('2026-09-05', 'quincena', 0, 50000);
  } catch (e) {
    errorNumPlazos = e instanceof RangeError;
  }
  assert(errorNumPlazos, 'Lanza RangeError descriptivo si numPlazos <= 0');

  let errorMontoTotal = false;
  try {
    calcularFechasYCuotas('2026-09-05', 'quincena', 2, -1000);
  } catch (e) {
    errorMontoTotal = e instanceof RangeError;
  }
  assert(errorMontoTotal, 'Lanza RangeError descriptivo si montoTotal <= 0');

  let errorTipoPlazo = false;
  try {
    calcularFechasYCuotas('2026-09-05', 'bimestre', 2, 50000);
  } catch (e) {
    errorTipoPlazo = e instanceof Error;
  }
  assert(errorTipoPlazo, 'Lanza Error si tipoPlazo no es válido');

  let errorFechaInvalida = false;
  try {
    calcularFechasYCuotas('fecha-invalida', 'quincena', 2, 50000);
  } catch (e) {
    errorFechaInvalida = e instanceof TypeError;
  }
  assert(errorFechaInvalida, 'Lanza TypeError si fechaInicio no es válida');

  console.log(`\n======================================================`);
  console.log(`🏁 RESULTADO: ${pasadas}/${total} pruebas unitarias superadas con éxito.`);
  console.log('======================================================\n');

  return { pasadas, total, exito: pasadas === total };
}

// Ejecución automática en consola al invocar directamente con Node.js
const nodeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
const isNodeCLI =
  Boolean(nodeProcess?.argv?.[1]?.replace(/\\/g, '/').endsWith('src/utils/utils.js'));

if (isNodeCLI) {
  ejecutarPruebasUnitarias();
}
