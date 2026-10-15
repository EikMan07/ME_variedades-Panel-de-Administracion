import { createClient } from '@supabase/supabase-js';

// Credenciales oficiales de Supabase con respaldo directo de producción para Vercel
export const SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL || 'https://pfygdgyyuxcdaffhkowr.supabase.co';

export const SUPABASE_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_KEY;

export const HAS_SUPABASE_ENV = Boolean(
  import.meta.env?.VITE_SUPABASE_URL &&
  (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)
);

// Inicialización garantizada del cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Función de diagnóstico que audita y verifica la conexión real en vivo contra Supabase.
 * - Siempre cuenta con URL y Llave Anon válidas por el respaldo de producción.
 * - Realiza consulta ligera con { head: true, count: 'exact' } sobre la tabla clientes.
 *
 * @returns {Promise<{ conectada: boolean, error: string | null, faltanVariables: boolean, totalClientes: number }>}
 */
export async function verificarEstadoConexionSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      conectada: false,
      faltanVariables: true,
      error: 'Variables de conexión a Supabase no configuradas.',
      totalClientes: 0,
    };
  }

  try {
    const { count, error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error de conexión Supabase:', error.message);
      return {
        conectada: false,
        faltanVariables: false,
        error: error.message || 'Error de políticas RLS o acceso a la tabla clientes.',
        totalClientes: 0,
      };
    }

    return {
      conectada: true,
      faltanVariables: false,
      error: null,
      totalClientes: typeof count === 'number' ? count : 0,
    };
  } catch (err) {
    console.error('❌ Excepción al verificar conexión Supabase:', err);
    return {
      conectada: false,
      faltanVariables: false,
      error: err?.message || 'Error inesperado de red al contactar con Supabase.',
      totalClientes: 0,
    };
  }
}
