-- ==============================================================================
-- MIGRACIÓN OPCIÓN B: COLUMNAS DEDICADAS PARA CRONOGRAMA DE PRÉSTAMOS
-- ==============================================================================
-- Agrega columnas dedicadas para cuotas acordadas, tipo de plazo y número de plazos,
-- manteniendo la columna 'abonos' exclusivamente para los pagos realizados.

ALTER TABLE public.prestamos 
    ADD COLUMN IF NOT EXISTS cuotas JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tipo_plazo TEXT,
    ADD COLUMN IF NOT EXISTS num_plazos INTEGER;

-- Verificación de estructura
COMMENT ON COLUMN public.prestamos.cuotas IS 'Plan de cuotas acordadas generado por el sistema';
COMMENT ON COLUMN public.prestamos.tipo_plazo IS 'Frecuencia de amortización: Semanal, Quincenal, Mensual, etc.';
COMMENT ON COLUMN public.prestamos.num_plazos IS 'Cantidad total de cuotas acordadas';
