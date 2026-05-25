-- ============================================================
-- Esquema completo de MD FarmaSalud para Railway PostgreSQL
-- Se ejecuta automáticamente al iniciar el backend (Spring Boot)
-- Todas las sentencias usan IF NOT EXISTS para ser idempotentes
-- gen_random_uuid() es nativo en PostgreSQL 13+ (no requiere pgcrypto)
-- ============================================================

-- ============ USUARIOS ============
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'empleado',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CATÁLOGOS ============
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit TEXT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    correo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento TEXT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PRODUCTOS ============
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    codigo_barras TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    laboratorio TEXT,
    marca TEXT,
    tipo_medicamento TEXT NOT NULL DEFAULT 'comercial',
    precio_compra NUMERIC(12,2) NOT NULL DEFAULT 0,
    precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva NUMERIC(5,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    lote TEXT,
    fecha_vencimiento DATE,
    registro_invima TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ VENTAS ============
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero SERIAL UNIQUE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    vendedor_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    estado TEXT NOT NULL DEFAULT 'completada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ COMPRAS ============
CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero SERIAL UNIQUE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    usuario_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'completada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CAJA ============
CREATE TABLE IF NOT EXISTS cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    monto_apertura NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_cierre NUMERIC(12,2),
    abierta_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cerrada_at TIMESTAMPTZ,
    estado TEXT NOT NULL DEFAULT 'abierta',
    observaciones TEXT
);

-- ============ AUDITORÍA ============
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    tabla TEXT,
    registro_id TEXT,
    detalles JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ CONFIGURACIÓN ============
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL DEFAULT 'MD FarmaSalud',
    logo_url TEXT,
    singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO configuracion (brand_name, singleton)
VALUES ('MD FarmaSalud', true)
ON CONFLICT (singleton) DO NOTHING;

-- ============ ÍNDICES ============
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_ventas_created ON ventas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_compras_compra ON detalle_compras(compra_id);
CREATE INDEX IF NOT EXISTS idx_cajas_usuario ON cajas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cajas_estado ON cajas(estado);
