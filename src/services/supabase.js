import { createClient } from '@supabase/supabase-js';

// Lectura de variables de entorno de Vite / Vercel
const envUrl = import.meta.env?.VITE_SUPABASE_URL;
const envAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fallback de contingencia del proyecto
const FALLBACK_URL = 'https://pfygdgyyuxcdaffhkowr.supabase.co';
const FALLBACK_KEY = 'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';

// URL base del proyecto Supabase y Llave Pública Anónima / Publicable
export const SUPABASE_URL = envUrl || FALLBACK_URL;
export const SUPABASE_KEY = envAnonKey || FALLBACK_KEY;

// Flag explícito que verifica si el entorno de ejecución inyectó las variables
export const HAS_SUPABASE_ENV = Boolean(envUrl && envAnonKey);

// Inicialización del cliente oficial de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Función de diagnóstico que audita y verifica la conexión real en vivo contra Supabase.
 * - Detecta si faltan variables de entorno en Vercel (envUrl o envAnonKey).
 * - Realiza consultas ligeras reales con { head: true, count: 'exact' } sobre las tablas clave (clientes, productos).
 * - Detecta bloqueos silenciosos de RLS o problemas de red.
 *
 * @returns {Promise<{ conectada: boolean, error: string | null, faltanVariables: boolean, totalClientes?: number }>}
 */
export async function verificarEstadoConexionSupabase() {
  // 1. Verificación de variables en el entorno de build / ejecución
  if (!envUrl || !envAnonKey) {
    console.warn('⚠️ [Supabase Diagnostic] Variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas en el entorno.');
    return {
      conectada: false,
      faltanVariables: true,
      error: 'Variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas en el entorno de Vercel.',
      totalClientes: 0,
    };
  }

  try {
    // 2. Consulta ligera a clientes (head: true para evitar descargar datos innecesarios)
    const { count: countClientes, error: errorClientes } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });

    if (errorClientes) {
      console.error('❌ [Supabase Diagnostic] Error en tabla clientes:', errorClientes);
      return {
        conectada: false,
        faltanVariables: false,
        error: errorClientes.message || 'Error de políticas RLS o permisos en tabla clientes.',
        totalClientes: 0,
      };
    }

    // 3. Consulta ligera a productos para verificar el inventario
    const { count: countProductos, error: errorProductos } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true });

    if (errorProductos) {
      console.error('❌ [Supabase Diagnostic] Error en tabla productos:', errorProductos);
      return {
        conectada: false,
        faltanVariables: false,
        error: errorProductos.message || 'Error de políticas RLS o permisos en tabla productos.',
        totalClientes: countClientes ?? 0,
      };
    }

    // Conexión exitosa, sin bloqueos de RLS
    return {
      conectada: true,
      faltanVariables: false,
      error: null,
      totalClientes: countClientes ?? 0,
      totalProductos: countProductos ?? 0,
    };
  } catch (err) {
    console.error('❌ [Supabase Diagnostic] Excepción de conexión:', err);
    return {
      conectada: false,
      faltanVariables: false,
      error: err?.message || 'Error inesperado de red al contactar con Supabase.',
      totalClientes: 0,
    };
  }
}
