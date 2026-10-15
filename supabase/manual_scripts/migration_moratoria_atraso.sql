-- ==============================================================================
-- MIGRACIÓN: RECARGO POR MORATORIA EN PRÉSTAMOS Y VENTAS A CRÉDITO
-- PROYECTO ME VARIEDADES — ARQUITECTURA MODULAR Y MOTOR FINANCIERO (RNF-08)
-- ==============================================================================

-- 1. AGREGAR COLUMNAS A TABLA: public.prestamos
ALTER TABLE public.prestamos 
    ADD COLUMN IF NOT EXISTS moratoria_tipo TEXT DEFAULT 'semana',
    ADD COLUMN IF NOT EXISTS moratoria_monto NUMERIC(12, 2) DEFAULT 0;

COMMENT ON COLUMN public.prestamos.moratoria_tipo IS 'Frecuencia de mora: dia, semana, mes';
COMMENT ON COLUMN public.prestamos.moratoria_monto IS 'Monto fijo en colones que se suma al saldo por cada período de atraso completo';

-- 2. AGREGAR COLUMNAS A TABLA: public.pedidos (Ventas a crédito)
ALTER TABLE public.pedidos 
    ADD COLUMN IF NOT EXISTS moratoria_tipo TEXT DEFAULT 'semana',
    ADD COLUMN IF NOT EXISTS moratoria_monto NUMERIC(12, 2) DEFAULT 0;

COMMENT ON COLUMN public.pedidos.moratoria_tipo IS 'Frecuencia de mora: dia, semana, mes para ventas a crédito';
COMMENT ON COLUMN public.pedidos.moratoria_monto IS 'Monto fijo en colones que se suma al saldo por cada período de atraso completo';
