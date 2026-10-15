-- ==============================================================================
-- MIGRACIÓN DDL: AGREGAR COLUMNA tipo_pago A TABLA public.pagos
-- PLATAFORMA "ME VARIEDADES" — BASE DE DATOS SUPABASE
-- FECHA: 2026-09-07
-- ==============================================================================

-- 1. Agregar columna tipo_pago permitiendo NULL (sin default forzado que enmascare datos ausentes)
ALTER TABLE public.pagos
ADD COLUMN IF NOT EXISTS tipo_pago TEXT;

-- 2. Documentar la columna en el catálogo de PostgreSQL
COMMENT ON COLUMN public.pagos.tipo_pago IS 'Frecuencia o tipo de cobro acordado (ej. Semanal, Quincenal, Mensual). Nullable sin default forzado.';
