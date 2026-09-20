-- ==============================================================================
-- SCRIPT DE SEGURIDAD Y DEPURACIÓN DE USUARIOS (SUPABASE AUTH & USUARIOS)
-- PLATAFORMA "ME VARIEDADES" — ACCESO EXCLUSIVO: maria / DSE777
-- ==============================================================================

-- 1. HABILITAR EXTENSIÓN CRIPTOGRÁFICA PARA BCRYPT HASHING
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. REVOCAR SESIONES ACTIVAS Y TOKENS JWT ANTERIORES
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;

-- 3. ELIMINAR IDENTIDADES Y USUARIOS ANTIGUOS EN AUTH.USERS (EXCEPTO O RECREANDO A MARIA)
DELETE FROM auth.identities;
DELETE FROM auth.users WHERE email <> 'maria@mevariedades.com';

-- 4. INSERTAR O ACTUALIZAR EL USUARIO ADMINISTRADOR CON CONTRASEÑA ENCRIPTADA (DSE777)
DO $$
DECLARE
    v_user_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Si el usuario ya existe en auth.users, actualizar su contraseña a DSE777
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'maria@mevariedades.com') THEN
        UPDATE auth.users
        SET 
            encrypted_password = crypt('DSE777', gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW(),
            raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
            raw_user_meta_data = '{"nombre": "María", "rol": "administradora"}'
        WHERE email = 'maria@mevariedades.com';
    ELSE
        -- Insertar el nuevo usuario administrador en auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'maria@mevariedades.com',
            crypt('DSE777', gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"nombre": "María", "rol": "administradora"}',
            NOW(),
            NOW()
        );

        -- Crear la identidad asociada en auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            json_build_object('sub', v_user_id::text, 'email', 'maria@mevariedades.com'),
            'email',
            'maria@mevariedades.com',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- 5. SI EXISTE UNA TABLA PERSONALIZADA DE USUARIOS (ej. public.usuarios o public.perfiles)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
        DELETE FROM public.usuarios;
        INSERT INTO public.usuarios (usuario, email, contrasena_hash, nombre, rol, created_at)
        VALUES ('maria', 'maria@mevariedades.com', crypt('DSE777', gen_salt('bf')), 'María', 'administradora', NOW());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfiles') THEN
        DELETE FROM public.perfiles WHERE email <> 'maria@mevariedades.com';
    END IF;
END $$;

-- 6. VERIFICACIÓN FINAL DE USUARIOS EN EL SISTEMA
SELECT 
    id, 
    email, 
    role, 
    email_confirmed_at, 
    created_at, 
    raw_user_meta_data 
FROM auth.users;
