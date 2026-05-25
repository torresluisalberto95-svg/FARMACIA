-- ============================================================
-- MIGRACIÓN: Transición de Supabase Auth → app_users (Spring Boot)
-- Ejecutar en el SQL Editor de Supabase ANTES de arrancar el backend
-- ============================================================

-- Intentar crear extensiones de forma tolerante: si faltan permisos, sólo se registra un NOTICE
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear la extensión pgcrypto: %', SQLERRM;
  END;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear la extensión uuid-ossp: %', SQLERRM;
  END;
END
$$;

-- 1. Tabla de usuarios gestionada por Spring Boot
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'empleado',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Eliminar FK constraints que apuntan a auth.users en tablas de aplicación
ALTER TABLE IF EXISTS public.ventas     DROP CONSTRAINT IF EXISTS ventas_vendedor_id_fkey;
ALTER TABLE IF EXISTS public.compras    DROP CONSTRAINT IF EXISTS compras_usuario_id_fkey;
ALTER TABLE IF EXISTS public.cajas      DROP CONSTRAINT IF EXISTS cajas_usuario_id_fkey;
ALTER TABLE IF EXISTS public.clientes   DROP CONSTRAINT IF EXISTS clientes_created_by_fkey;
ALTER TABLE IF EXISTS public.auditoria  DROP CONSTRAINT IF EXISTS auditoria_usuario_id_fkey;

-- 3. Crear FK constraints apuntando a app_users
ALTER TABLE IF EXISTS public.ventas
  ADD CONSTRAINT ventas_vendedor_id_fkey
  FOREIGN KEY (vendedor_id) REFERENCES public.app_users(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.compras
  ADD CONSTRAINT compras_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.app_users(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.cajas
  ADD CONSTRAINT cajas_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.app_users(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.clientes
  ADD CONSTRAINT clientes_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.auditoria
  ADD CONSTRAINT auditoria_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 4. Asegurar que la tabla configuracion tiene las columnas necesarias
ALTER TABLE IF EXISTS public.configuracion
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Desactivar RLS en tablas de aplicación (Spring Boot maneja su propia autorización)
ALTER TABLE IF EXISTS public.productos    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ventas       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.detalle_ventas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compras      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.detalle_compras DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proveedores  DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categorias   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cajas        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.configuracion DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_users    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTA: El usuario admin se crea automáticamente al arrancar
--       el backend Spring Boot por primera vez (DataInitializer).
--       Por defecto: admin@mdfarmasalud.com / Admin123!
--       Configura ADMIN_EMAIL y ADMIN_PASSWORD en las env vars de Render.
-- ============================================================
