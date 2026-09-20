/**
 * SCRIPT DE IMPORTACIÓN HISTÓRICA BCCR PARA ME VARIEDADES
 * Uso: node scripts/import_tipo_cambio_csv.mjs [ruta_al_archivo.csv]
 * 
 * Formato esperado del CSV (con encabezado):
 * fecha,compra,venta
 * 2026-08-01,445.10,450.25
 * 2026-08-02,445.10,450.25
 * ...
 * 
 * Requiere variables de entorno (o archivo .env.local):
 * SUPABASE_URL=https://...
 * SUPABASE_SERVICE_ROLE_KEY=...
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Carga automática de .env si no está en process.env (sin imprimir valores)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log(`
ℹ️ SCRIPT DE IMPORTACIÓN HISTÓRICA DE TIPO DE CAMBIO
Uso: node scripts/import_tipo_cambio_csv.mjs <ruta-al-archivo.csv>

Ejemplo de estructura del archivo CSV:
fecha,compra,venta
2026-08-15,442.80,448.10
2026-08-16,442.80,448.10

Reglas:
1. La fecha debe tener formato YYYY-MM-DD.
2. Compra y venta deben ser números mayores a cero (decimales con punto).
3. Requiere configurar SUPABASE_SERVICE_ROLE_KEY en el entorno.
  `);
  process.exit(0);
}

const resolvedPath = path.resolve(process.cwd(), csvFilePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Error: El archivo "${resolvedPath}" no existe.`);
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas en las variables de entorno.');
  console.error('Este script requiere privilegios de service_role para insertar en la tabla protegida.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runImport() {
  console.log(`📄 Leyendo archivo: ${resolvedPath}...`);
  const rawContent = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    console.error('❌ Error: El archivo CSV está vacío o solo contiene encabezados.');
    process.exit(1);
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim());
  const fechaIdx = headers.indexOf('fecha');
  const compraIdx = headers.indexOf('compra');
  const ventaIdx = headers.indexOf('venta');

  if (fechaIdx === -1 || compraIdx === -1 || ventaIdx === -1) {
    console.error('❌ Error: El encabezado del CSV debe contener las columnas: fecha, compra, venta');
    process.exit(1);
  }

  const records = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 3) continue;

    const fecha = cols[fechaIdx];
    const compra = parseFloat(cols[compraIdx]);
    const venta = parseFloat(cols[ventaIdx]);

    if (!dateRegex.test(fecha)) {
      console.warn(`⚠️ Fila ${i + 1}: Fecha inválida (${fecha}). Omitiendo.`);
      continue;
    }

    if (isNaN(compra) || compra <= 0 || isNaN(venta) || venta <= 0) {
      console.warn(`⚠️ Fila ${i + 1}: Valores numéricos inválidos (compra=${cols[compraIdx]}, venta=${cols[ventaIdx]}). Omitiendo.`);
      continue;
    }

    records.push({
      fecha,
      compra,
      venta,
      fuente: 'bccr_import',
      created_at: new Date().toISOString()
    });
  }

  console.log(`🔍 Se validaron ${records.length} registros listos para importar.`);

  if (records.length === 0) {
    console.log('No hay registros válidos para insertar.');
    process.exit(0);
  }

  // Insertar en lotes de 100
  const CHUNK_SIZE = 100;
  let insertados = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('tipo_cambio_historial')
      .upsert(chunk, { onConflict: 'fecha', ignoreDuplicates: true });

    if (error) {
      console.error(`❌ Error importando lote ${Math.floor(i / CHUNK_SIZE) + 1}:`, error.message);
      console.error(`⚠️ Se alcanzaron a escribir ${insertados} filas antes de la detención.`);
      process.exit(1);
    }
    insertados += chunk.length;
    console.log(`✓ Lote procesado: ${insertados} / ${records.length}`);
  }

  console.log(`✅ Importación completada con éxito. Total registros: ${insertados}`);
}

runImport().catch(err => {
  console.error('❌ Error inesperado durante la importación:', err);
  process.exit(1);
});
