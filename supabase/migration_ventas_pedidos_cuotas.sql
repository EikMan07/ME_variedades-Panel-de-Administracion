-- ==============================================================================
-- MIGRACIÓN VENTAS / PEDIDOS: COLUMNAS DE CRÉDITO Y PRECIOS REALES
-- ==============================================================================
-- Agrega columnas dedicadas para almacenar el cronograma de cuotas, plazos,
-- modalidad y precios reales en la tabla pedidos (respaldo del módulo Ventas).

ALTER TABLE public.pedidos 
    ADD COLUMN IF NOT EXISTS cuotas JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tipo_plazo TEXT,
    ADD COLUMN IF NOT EXISTS num_plazos INTEGER,
    ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'contado',
    ADD COLUMN IF NOT EXISTS precio_facturacion NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS precio_venta_real NUMERIC(12, 2);

-- Comentarios explicativos de auditoría
COMMENT ON COLUMN public.pedidos.cuotas IS 'Plan de cuotas acordadas generado por el sistema para ventas a crédito';
COMMENT ON COLUMN public.pedidos.tipo_plazo IS 'Frecuencia de cobro: semana, quincena, mes';
COMMENT ON COLUMN public.pedidos.num_plazos IS 'Cantidad total de cuotas acordadas';
COMMENT ON COLUMN public.pedidos.modalidad IS 'Modalidad de venta: contado o credito';
COMMENT ON COLUMN public.pedidos.precio_facturacion IS 'Precio de facturación base / costo unitario';
COMMENT ON COLUMN public.pedidos.precio_venta_real IS 'Precio de venta real pactado con el cliente';
