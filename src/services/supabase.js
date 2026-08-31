import { createClient } from '@supabase/supabase-js';

// URL base del proyecto Supabase y Llave Pública Anónima
export const SUPABASE_URL = 'https://pfygdgyyuxcdaffhkowr.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';

// Inicialización del cliente oficial de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
