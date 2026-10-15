-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: CORRECCIÓN DE CASCADA (CASCADE) Y RLS EN SUPABASE
-- PROYECTO ME VARIEDADES — ELIMINACIÓN SEGURA DE CLIENTES Y PRÉSTAMOS
-- ==============================================================================

-- 1. ELIMINAR Y RECREAR CLAVES FORÁNEAS HACIA CLIENTES CON "ON DELETE CASCADE"
-- Esto permite que al eliminar un cliente, todos sus registros asociados
-- (pedidos, pagos, cobros, préstamos y facturas) se eliminen en cascada limpiamente.

DO $$
BEGIN
    -- A) TABLA: pedidos -> clientes(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'pedidos' 
        AND constraint_name = 'pedidos_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_cliente_id_fkey;
    END IF;
    ALTER TABLE public.pedidos 
        ADD CONSTRAINT pedidos_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
        ON DELETE CASCADE;

    -- B) TABLA: pagos -> clientes(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'pagos' 
        AND constraint_name = 'pagos_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.pagos DROP CONSTRAINT pagos_cliente_id_fkey;
    END IF;
    ALTER TABLE public.pagos 
        ADD CONSTRAINT pagos_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
        ON DELETE CASCADE;

    -- C) TABLA: cobros -> clientes(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'cobros' 
        AND constraint_name = 'cobros_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.cobros DROP CONSTRAINT cobros_cliente_id_fkey;
    END IF;
    ALTER TABLE public.cobros 
        ADD CONSTRAINT cobros_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
        ON DELETE CASCADE;

    -- D) TABLA: prestamos -> clientes(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'prestamos' 
        AND constraint_name = 'prestamos_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.prestamos DROP CONSTRAINT prestamos_cliente_id_fkey;
    END IF;
    ALTER TABLE public.prestamos 
        ADD CONSTRAINT prestamos_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
        ON DELETE CASCADE;

    -- E) TABLA: facturas_comprobantes -> clientes(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'facturas_comprobantes' 
        AND constraint_name = 'facturas_comprobantes_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.facturas_comprobantes DROP CONSTRAINT facturas_comprobantes_cliente_id_fkey;
    END IF;
    ALTER TABLE public.facturas_comprobantes 
        ADD CONSTRAINT facturas_comprobantes_cliente_id_fkey 
        FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
        ON DELETE CASCADE;

END $$;


-- ==============================================================================
-- 2. GARANTIZAR PERMISOS TOTALES Y POLÍTICAS RLS EN TODAS LAS TABLAS
-- ==============================================================================

-- Opción recomendada para operaciones directas del panel de administración:
-- Deshabilitar RLS en tablas transaccionales o configurar políticas 'ALL' permisivas.
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_comprobantes DISABLE ROW LEVEL SECURITY;

-- Si se prefiere mantener RLS habilitado, las siguientes políticas garantizan operaciones DELETE/ALL:
/*
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a clientes" ON public.clientes;
CREATE POLICY "Acceso total a clientes" ON public.clientes FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a prestamos" ON public.prestamos;
CREATE POLICY "Acceso total a prestamos" ON public.prestamos FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a pedidos" ON public.pedidos;
CREATE POLICY "Acceso total a pedidos" ON public.pedidos FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a pagos" ON public.pagos;
CREATE POLICY "Acceso total a pagos" ON public.pagos FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a cobros" ON public.cobros;
CREATE POLICY "Acceso total a cobros" ON public.cobros FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.facturas_comprobantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total a facturas" ON public.facturas_comprobantes;
CREATE POLICY "Acceso total a facturas" ON public.facturas_comprobantes FOR ALL TO public USING (true) WITH CHECK (true);
*/

-- ==============================================================================
-- 3. PERMISOS DE TABLAS PARA ROLES DE SUPABASE (anon, authenticated, service_role)
-- ==============================================================================
GRANT ALL ON TABLE public.clientes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prestamos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pedidos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pagos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cobros TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.productos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.facturas_comprobantes TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
