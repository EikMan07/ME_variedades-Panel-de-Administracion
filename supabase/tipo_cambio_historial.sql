-- ==============================================================================
-- MIGRACIÓN: TABLA DE HISTORIAL DE TIPO DE CAMBIO BCCR (USD -> CRC)
-- PROYECTO ME VARIEDADES — MÓDULO TIPO DE CAMBIO (RF-C)
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA HISTORIAL
CREATE TABLE IF NOT EXISTS public.tipo_cambio_historial (
    fecha DATE PRIMARY KEY,
    compra NUMERIC(8, 2) NOT NULL,
    venta NUMERIC(8, 2) NOT NULL,
    fuente TEXT NOT NULL DEFAULT 'gometa', -- 'gometa' | 'bccr_import'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios explicativos de la estructura
COMMENT ON TABLE public.tipo_cambio_historial IS 'Historial diario oficial del tipo de cambio del dólar del BCCR';
COMMENT ON COLUMN public.tipo_cambio_historial.fecha IS 'Fecha oficial del BCCR (YYYY-MM-DD). Clave primaria única para evitar duplicados';
COMMENT ON COLUMN public.tipo_cambio_historial.compra IS 'Precio oficial de compra en colones costarricenses (₡)';
COMMENT ON COLUMN public.tipo_cambio_historial.venta IS 'Precio oficial de venta en colones costarricenses (₡)';
COMMENT ON COLUMN public.tipo_cambio_historial.fuente IS 'Origen del registro: gometa (captura diaria automática/cron) o bccr_import (importación histórica CSV)';

-- 2. POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.tipo_cambio_historial ENABLE ROW LEVEL SECURITY;

-- Política de SOLO LECTURA para clientes frontend (anon y authenticated)
DROP POLICY IF EXISTS "Lectura publica tipo_cambio_historial" ON public.tipo_cambio_historial;
CREATE POLICY "Lectura publica tipo_cambio_historial" 
ON public.tipo_cambio_historial 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- No se definen políticas de INSERT/UPDATE/DELETE para anon/authenticated,
-- lo que bloquea estrictamente cualquier intento de escritura desde el frontend.
-- Las inserciones y actualizaciones se realizan exclusivamente desde el servidor
-- mediante SUPABASE_SERVICE_ROLE_KEY (que hace bypass de RLS).

-- Permisos de tabla
GRANT SELECT ON TABLE public.tipo_cambio_historial TO anon, authenticated;
GRANT ALL ON TABLE public.tipo_cambio_historial TO service_role;
