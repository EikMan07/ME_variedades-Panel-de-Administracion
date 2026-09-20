import { supabase } from './supabase.js';

/**
 * ME VARIEDADES — Servicio de Tipo de Cambio (BCCR / Gometa)
 * 
 * Gestiona la consulta en tiempo real desde el endpoint serverless (/api/tipo-cambio),
 * la consulta de series históricas persistidas en Supabase (tipo_cambio_historial),
 * y el cálculo de métricas financieras de variación.
 */

/**
 * Obtiene la cotización oficial del día (compra y venta) desde el endpoint seguro.
 * Realiza upsert oportunista en el servidor y maneja contingencia automáticamente.
 */
export async function fetchTipoCambioActual() {
  try {
    const res = await fetch('/api/tipo-cambio', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP ${res.status} al consultar tipo de cambio`);
    }

    const data = await res.json();
    return {
      compra: Number(data.compra),
      venta: Number(data.venta),
      fecha: data.fecha,
      compraDate: data.compra_date || data.fecha,
      ventaDate: data.venta_date || data.fecha,
      updated: data.updated || '',
      fuente: data.fuente || 'gometa',
      cached: Boolean(data.cached),
      persisted: Boolean(data.persisted),
      timestamp: data.timestamp || Date.now(),
      aviso: data.aviso || null,
      dbError: data.db_error || null,
    };
  } catch (err) {
    console.error('[tipoCambioService] Error en fetchTipoCambioActual:', err);
    throw err;
  }
}

/**
 * Calcula la fecha de corte para filtrar la serie histórica según el rango seleccionado.
 * @param {('1D'|'5D'|'1M'|'1A'|'5A'|'MAX')} rango
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function calcularFechaCorte(rango) {
  const hoy = new Date();

  switch (rango) {
    case '1D': {
      // Tomamos hoy y ayer para poder comparar variación intradía si existe
      const d = new Date(hoy);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    case '5D': {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 5);
      return d.toISOString().split('T')[0];
    }
    case '1M': {
      const d = new Date(hoy);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    }
    case '1A': {
      const d = new Date(hoy);
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split('T')[0];
    }
    case '5A': {
      const d = new Date(hoy);
      d.setFullYear(d.getFullYear() - 5);
      return d.toISOString().split('T')[0];
    }
    case 'MAX':
    default:
      return '2000-01-01';
  }
}

/**
 * Consulta la serie histórica de tipo de cambio almacenada en Supabase.
 * Solo utiliza datos reales persistidos (sin datos sintéticos ni mock).
 * 
 * @param {('1D'|'5D'|'1M'|'1A'|'5A'|'MAX')} rango
 * @returns {Promise<{
 *   datos: Array<{ fecha: string, compra: number, venta: number, fuente: string }>,
 *   tieneSuficientesDatos: boolean,
 *   totalPuntos: number,
 *   estadisticas: { actual: number, min: number, max: number, promedio: number, variacion: number }
 * }>}
 */
export async function fetchHistorialTipoCambio(rango = '1M') {
  try {
    const fechaCorte = calcularFechaCorte(rango);

    let rawRows = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('tipo_cambio_historial')
        .select('fecha, compra, venta, fuente, created_at')
        .gte('fecha', fechaCorte)
        .order('fecha', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('[tipoCambioService] Error consultando historial en Supabase:', error);
        throw error;
      }

      if (data && data.length > 0) {
        rawRows.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const rows = rawRows.map((row) => ({
      fecha: row.fecha,
      compra: Number(row.compra),
      venta: Number(row.venta),
      fuente: row.fuente || 'gometa',
      createdAt: row.created_at,
    }));

    const totalPuntos = rows.length;
    // Para rangos multi-día (5D, 1M, 1A, 5A, MAX) requerimos al menos 2 puntos para dibujar una línea de tendencia real.
    // Para 1D, 1 punto es válido.
    const tieneSuficientesDatos = rango === '1D' ? totalPuntos >= 1 : totalPuntos >= 2;

    // Cálculo de estadísticas financieras basadas en la tasa de venta (referencia estándar)
    let estadisticas = {
      actual: 0,
      min: 0,
      max: 0,
      promedio: 0,
      variacion: 0,
      compraActual: 0,
      compraMin: 0,
      compraMax: 0,
    };

    if (totalPuntos > 0) {
      const ventas = rows.map((r) => r.venta);
      const compras = rows.map((r) => r.compra);
      const actualVenta = ventas[ventas.length - 1];
      const actualCompra = compras[compras.length - 1];
      const primerVenta = ventas[0];
      const primerCompra = compras[0];

      const minVenta = Math.min(...ventas);
      const maxVenta = Math.max(...ventas);
      const sumaVenta = ventas.reduce((acc, v) => acc + v, 0);
      const promedioVenta = sumaVenta / totalPuntos;
      const variacionVenta = primerVenta > 0 ? ((actualVenta - primerVenta) / primerVenta) * 100 : 0;

      const minCompra = Math.min(...compras);
      const maxCompra = Math.max(...compras);
      const sumaCompra = compras.reduce((acc, c) => acc + c, 0);
      const promedioCompra = sumaCompra / totalPuntos;
      const variacionCompra = primerCompra > 0 ? ((actualCompra - primerCompra) / primerCompra) * 100 : 0;

      estadisticas = {
        venta: {
          actual: actualVenta,
          min: minVenta,
          max: maxVenta,
          promedio: Number(promedioVenta.toFixed(2)),
          variacion: Number(variacionVenta.toFixed(2)),
        },
        compra: {
          actual: actualCompra,
          min: minCompra,
          max: maxCompra,
          promedio: Number(promedioCompra.toFixed(2)),
          variacion: Number(variacionCompra.toFixed(2)),
        },
        actual: actualVenta,
        min: minVenta,
        max: maxVenta,
        promedio: Number(promedioVenta.toFixed(2)),
        variacion: Number(variacionVenta.toFixed(2)),
        compraActual: actualCompra,
        compraMin: minCompra,
        compraMax: maxCompra,
      };
    }

    // Reducción de puntos dibujados para el gráfico en rangos extensos (1A, 5A, MAX)
    // para optimizar el rendimiento de Chart.js en dispositivos móviles y de escritorio.
    const datosGrafico = downsampleData(rows, rango);

    return {
      datos: rows,
      datosGrafico,
      tieneSuficientesDatos,
      totalPuntos,
      estadisticas,
    };
  } catch (err) {
    console.error('[tipoCambioService] Error en fetchHistorialTipoCambio:', err);
    throw err;
  }
}

/**
 * Reduce la densidad de puntos para el gráfico interactivo sin perder fidelidad visual.
 * 1D, 5D, 1M: Se devuelven todos los puntos diarios.
 * 1A: Agrupación semanal (promedio semanal, ~52 puntos).
 * 5A y MAX: Agrupación mensual (promedio mensual, ~60 puntos en 5A).
 */
export function downsampleData(rows, rango) {
  if (!rows || rows.length <= 60) return rows;

  if (rango === '1A') {
    // Agrupación semanal
    const semanas = {};
    for (const r of rows) {
      const d = new Date(r.fecha + 'T12:00:00Z');
      const primerDia = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const semNum = Math.ceil((((d - primerDia) / 86400000) + primerDia.getUTCDay() + 1) / 7);
      const clave = `${d.getUTCFullYear()}-W${String(semNum).padStart(2, '0')}`;

      if (!semanas[clave]) {
        semanas[clave] = { fecha: r.fecha, compras: [], ventas: [] };
      }
      semanas[clave].fecha = r.fecha;
      semanas[clave].compras.push(r.compra);
      semanas[clave].ventas.push(r.venta);
    }

    return Object.values(semanas).map((g) => ({
      fecha: g.fecha,
      compra: Number((g.compras.reduce((a, b) => a + b, 0) / g.compras.length).toFixed(2)),
      venta: Number((g.ventas.reduce((a, b) => a + b, 0) / g.ventas.length).toFixed(2)),
    }));
  }

  if (rango === '5A' || rango === 'MAX') {
    // Agrupación mensual
    const meses = {};
    for (const r of rows) {
      const clave = r.fecha.slice(0, 7); // YYYY-MM
      if (!meses[clave]) {
        meses[clave] = { fecha: r.fecha, compras: [], ventas: [] };
      }
      meses[clave].fecha = r.fecha;
      meses[clave].compras.push(r.compra);
      meses[clave].ventas.push(r.venta);
    }

    return Object.values(meses).map((g) => ({
      fecha: g.fecha,
      compra: Number((g.compras.reduce((a, b) => a + b, 0) / g.compras.length).toFixed(2)),
      venta: Number((g.ventas.reduce((a, b) => a + b, 0) / g.ventas.length).toFixed(2)),
    }));
  }

  return rows;
}
