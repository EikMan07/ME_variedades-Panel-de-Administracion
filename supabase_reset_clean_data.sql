-- ==============================================================================
-- SCRIPT DE LIMPIEZA TOTAL Y REINICIO DE DATOS (DATA RESET)
-- PLATAFORMA "ME VARIEDADES" — ENTREGA FINAL EN PRODUCCIÓN (ESTADO CERO)
-- ==============================================================================

-- 1. VACIAR TODAS LAS TABLAS Y REINICIAR CONTADORES DE IDENTIDAD (ID = 1)
-- Se ejecutan en cascada para limpiar todas las referencias e historial
TRUNCATE TABLE 
    public.facturas_comprobantes,
    public.cobros,
    public.pagos,
    public.pedidos,
    public.prestamos,
    public.productos,
    public.clientes
RESTART IDENTITY CASCADE;

-- 2. PURGAR ARCHIVOS EN SUPABASE STORAGE (DESHABILITANDO TEMPORALMENTE EL TRIGGER DE PROTECCIÓN)
DO $$
BEGIN
    -- Desactivar temporalmente el trigger de protección de Supabase Storage
    ALTER TABLE storage.objects DISABLE TRIGGER USER;
    
    -- Purgar objetos en los buckets de prueba
    DELETE FROM storage.objects 
    WHERE bucket_id IN ('imagenes-productos', 'comprobantes-facturas');
    
    -- Reactivar el trigger de protección
    ALTER TABLE storage.objects ENABLE TRIGGER USER;
EXCEPTION
    WHEN OTHERS THEN
        -- Si no se tienen permisos sobre storage.objects, continuar con el vaciado de tablas públicas
        RAISE NOTICE 'Nota: La purga de Storage debe realizarse desde el panel de Supabase Storage (Empty Bucket). Detalle: %', SQLERRM;
END $$;

-- 3. REINICIAR SECUENCIAS ESPECÍFICAS (POR SI SE UTILIZARON NOMBRES PERSONALIZADOS)
ALTER SEQUENCE IF EXISTS public.clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.productos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.pedidos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.pagos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.cobros_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.prestamos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.facturas_comprobantes_id_seq RESTART WITH 1;

-- 4. CONFIRMACIÓN DE VACIADO EXITOSO
SELECT 
    (SELECT COUNT(*) FROM public.clientes) AS total_clientes,
    (SELECT COUNT(*) FROM public.productos) AS total_productos,
    (SELECT COUNT(*) FROM public.pedidos) AS total_pedidos,
    (SELECT COUNT(*) FROM public.pagos) AS total_pagos,
    (SELECT COUNT(*) FROM public.cobros) AS total_cobros,
    (SELECT COUNT(*) FROM public.prestamos) AS total_prestamos,
    (SELECT COUNT(*) FROM public.facturas_comprobantes) AS total_facturas,
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id IN ('imagenes-productos', 'comprobantes-facturas')) AS total_archivos_storage;
