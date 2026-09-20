/**
 * ME VARIEDADES — Serverless Function para Tipo de Cambio BCCR
 * Endpoint seguro: /api/tipo-cambio
 * 
 * Consulta la API oficial de Gometa (fuente: BCCR), normaliza el resultado,
 * realiza upsert oportunista en Supabase con SUPABASE_SERVICE_ROLE_KEY
 * y provee fallback resiliente a la base de datos si la API externa no responde.
 */

/* global process */
import { createClient } from '@supabase/supabase-js';

const GOMETA_URL_HTTPS = 'https://apis.gometa.org/tdc/tdc.json';
const GOMETA_URL_HTTP = 'http://apis.gometa.org/tdc/tdc.json';

// Inicialización de Supabase con credenciales del servidor
function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Consulta la API de Gometa intentando primero HTTPS y luego HTTP con timeout.
 */
async function fetchGometaData() {
  const urls = [GOMETA_URL_HTTPS, GOMETA_URL_HTTP];
  let lastError = null;

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ME-Variedades-Admin/4.2 (+https://me-variedades-panel-de-administraci.vercel.app)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        const data = JSON.parse(text);

        const compraNum = parseFloat(data.compra);
        const ventaNum = parseFloat(data.venta);

        if (!isNaN(compraNum) && compraNum > 0 && !isNaN(ventaNum) && ventaNum > 0) {
          return {
            compra: compraNum,
            venta: ventaNum,
            compra_date: data.compra_date || null,
            venta_date: data.venta_date || null,
            updated: data.updated || null,
          };
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta válida de la API de Gometa.');
}

/**
 * Respaldo: consulta el último registro almacenado en Supabase si Gometa falla.
 */
async function obtenerUltimoRegistroSupabase(supabaseClient) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from('tipo_cambio_historial')
      .select('fecha, compra, venta, fuente, created_at')
      .order('fecha', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Método no permitido. Utilice GET o POST.' });
  }

  // Validación de seguridad para Vercel Cron Job
  const isCron = req.query?.cron === '1' || req.headers['x-vercel-cron'] === '1';
  const cronSecret = process.env.CRON_SECRET;

  if (isCron && cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}` && req.headers['x-vercel-cron'] !== '1') {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(401).json({ error: 'Acceso no autorizado al cron de tipo de cambio.' });
    }
  }

  const supabaseServer = getSupabaseServerClient();

  try {
    // 1. Intentar consultar la API externa en vivo
    const gometa = await fetchGometaData();

    // 2. Criterio de Fecha de Registro:
    // Si compra_date y venta_date son iguales, usamos esa fecha.
    // Si difieren, usamos la fecha más reciente (venta_date >= compra_date ? venta_date : compra_date)
    // ya que la tasa de venta del día comercial activo marca la jornada vigente.
    let fechaFinal = gometa.venta_date || gometa.compra_date;
    if (gometa.venta_date && gometa.compra_date && gometa.venta_date !== gometa.compra_date) {
      fechaFinal = gometa.venta_date >= gometa.compra_date ? gometa.venta_date : gometa.compra_date;
    }

    // Fallback de fecha segura en caso improbable de que ambas vengan vacías
    if (!fechaFinal) {
      fechaFinal = new Date().toISOString().split('T')[0];
    }

    // 3. Upsert oportunista en Supabase (solo si service_role key está disponible)
    let persisted = false;
    let dbError = null;

    if (supabaseServer) {
      try {
        const { error: upsertErr } = await supabaseServer.from('tipo_cambio_historial').upsert(
          {
            fecha: fechaFinal,
            compra: gometa.compra,
            venta: gometa.venta,
            fuente: 'gometa',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'fecha' }
        );

        if (upsertErr) {
          dbError = upsertErr.message;
          console.error('[api/tipo-cambio] Error al persistir en Supabase:', upsertErr.message);
        } else {
          persisted = true;
        }
      } catch (dbEx) {
        dbError = dbEx.message;
        console.error('[api/tipo-cambio] Excepción al persistir en Supabase:', dbEx.message);
      }
    } else {
      console.warn('[api/tipo-cambio] SUPABASE_SERVICE_ROLE_KEY no configurada. Omitiendo persistencia en servidor.');
    }

    // Cabecera de caché para CDN y proxy Vercel (5 minutos = 300 segundos)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    // 4. Respuesta exitosa en vivo
    return res.status(200).json({
      compra: gometa.compra,
      venta: gometa.venta,
      fecha: fechaFinal,
      compra_date: gometa.compra_date,
      venta_date: gometa.venta_date,
      updated: gometa.updated,
      fuente: 'gometa',
      cached: false,
      persisted,
      ...(dbError ? { db_error: dbError } : {}),
      timestamp: Date.now(),
    });
  } catch (apiError) {
    console.warn('[api/tipo-cambio] Gometa no disponible. Activando fallback a caché de Supabase:', apiError.message);

    // 5. Fallback de Contingencia Resiliente: Recuperar último dato guardado en Supabase
    const registroCache = await obtenerUltimoRegistroSupabase(supabaseServer);

    if (registroCache) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
      return res.status(200).json({
        compra: parseFloat(registroCache.compra),
        venta: parseFloat(registroCache.venta),
        fecha: registroCache.fecha,
        compra_date: registroCache.fecha,
        venta_date: registroCache.fecha,
        updated: `Caché guardada el ${registroCache.fecha}`,
        fuente: registroCache.fuente || 'cache_supabase',
        cached: true,
        persisted: true,
        timestamp: new Date(registroCache.created_at || Date.now()).getTime(),
        aviso: 'Dato obtenido desde la última copia de seguridad por intermitencia en el proveedor externo.',
      });
    }

    // 6. Si tampoco hay caché en Supabase, responder error 503 sin inventar datos
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error: 'El servicio del BCCR no está disponible temporalmente y no hay registros previos en caché local.',
      detalles: apiError.message,
    });
  }
}
