-- ==============================================================================
-- MIGRACIÓN: ELIMINACIÓN DE RESIDUOS (FACTURAS/COMPROBANTES Y COBROS)
-- Proyecto: ME Variedades - Panel de Administración
-- Fecha: 2026-09-07
-- Descripción:
--   1. Elimina las tablas obsoletas public.facturas_comprobantes y public.cobros
--   2. Elimina cualquier restricción o índice asociado
--   3. Elimina el bucket obsoleto comprobantes-facturas y sus objetos en storage
--   4. Re-sincroniza las políticas de storage para que apunten únicamente a imagenes-productos
-- ==============================================================================

-- 1. Eliminar tablas obsoletas (con CASCADE e IF EXISTS por seguridad)
DROP TABLE IF EXISTS public.facturas_comprobantes CASCADE;
DROP TABLE IF EXISTS public.cobros CASCADE;

-- 2. Eliminar índices si sobrevivieron de forma huérfana
DROP INDEX IF EXISTS public.idx_facturas_cliente;
DROP INDEX IF EXISTS public.idx_cobros_cliente;

-- 3. Limpiar objetos y eliminar bucket de almacenamiento de comprobantes
DELETE FROM storage.objects WHERE bucket_id = 'comprobantes-facturas';
DELETE FROM storage.buckets WHERE id = 'comprobantes-facturas';

-- 4. Actualizar políticas de RLS en storage.objects para limitar exclusivamente al bucket activo 'imagenes-productos'
DROP POLICY IF EXISTS "Lectura publica de storage" ON storage.objects;
CREATE POLICY "Lectura publica de storage" ON storage.objects
FOR SELECT TO public USING (bucket_id IN ('imagenes-productos'));

DROP POLICY IF EXISTS "Subida publica de storage" ON storage.objects;
CREATE POLICY "Subida publica de storage" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id IN ('imagenes-productos'));

DROP POLICY IF EXISTS "Actualizacion publica de storage" ON storage.objects;
CREATE POLICY "Actualizacion publica de storage" ON storage.objects
FOR UPDATE TO public USING (bucket_id IN ('imagenes-productos'));

DROP POLICY IF EXISTS "Eliminacion publica de storage" ON storage.objects;
CREATE POLICY "Eliminacion publica de storage" ON storage.objects
FOR DELETE TO public USING (bucket_id IN ('imagenes-productos'));
