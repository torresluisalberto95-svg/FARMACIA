# MD FarmaSalud

Sistema de gestión para farmacias. Controla ventas, inventario, compras, caja y usuarios desde una sola plataforma.

**Stack:** Spring Boot 3.3 · Java 21 (backend) · React 19 + Vite (frontend) · Supabase PostgreSQL (base de datos)

**Producción:**
- Frontend: https://farmasaludmd2026.vercel.app
- Backend: https://farmacia-backend-md4f.onrender.com
- Base de datos: Supabase (proyecto `whfzmuqnhuklsxdiwwag`, región us-west-2)

---

## Módulos

| Módulo | Descripción |
|---|---|
| Dashboard | Resumen diario: ventas, ingresos, stock bajo, próximos vencimientos |
| Ventas | Registro de ventas con descuento por ítem, descuento global y cálculo de IVA |
| Compras | Registro de compras a proveedores con actualización automática de stock |
| Productos | CRUD de medicamentos con lote, fecha de vencimiento y registro INVIMA |
| Caja | Apertura y cierre de caja con resumen de movimientos |
| Clientes | Directorio de clientes con historial de compras |
| Proveedores | Gestión de proveedores |
| Categorías | Clasificación de productos |
| Usuarios | Administración de empleados (solo admin) |
| Reportes | Exportación y análisis de datos (solo admin) |
| Configuración | Nombre y logo de la farmacia |

---

## Arquitectura

```
FARMACIA/
├── backend/                  # Spring Boot — API REST + Spring Security JWT
│   ├── src/
│   │   └── main/
│   │       ├── java/com/farmacia/
│   │       │   ├── controller/   # Endpoints REST
│   │       │   ├── service/      # Lógica de negocio
│   │       │   ├── model/        # Entidades JPA
│   │       │   ├── repository/   # Spring Data JPA
│   │       │   ├── security/     # JWT Filter + UserDetailsService
│   │       │   ├── config/       # SecurityConfig, CORS
│   │       │   └── init/         # DataInitializer (admin inicial)
│   │       └── resources/
│   │           ├── application.properties
│   │           └── schema.sql    # Esquema completo (se ejecuta al iniciar)
│   ├── Dockerfile
│   ├── pom.xml
│   └── .env.example
├── frontend/                 # React 19 + Vite — SPA
│   ├── src/
│   ├── vercel.json
│   └── package.json
├── render.yaml               # Configuración de deploy en Render
└── README.md
```

### Backend (Spring Boot)

- **Java 21** · Spring Boot 3.3 · Spring Security · Spring Data JPA · Hibernate
- **Autenticación:** JWT stateless — tokens en `Authorization: Bearer`
- **Roles:** `ADMIN` (acceso total) · `EMPLEADO` (acceso operativo)
- **Base de datos:** Supabase PostgreSQL vía JDBC (Session Pooler, puerto 5432)
- **Esquema:** `schema.sql` se ejecuta automáticamente al iniciar (`spring.sql.init.mode=always`)
- **Admin inicial:** Creado por `DataInitializer` si no existe al arrancar

### Frontend (React + Vite)

- **React 19** · TanStack Router · Axios · shadcn/ui · Tailwind CSS 4
- **Autenticación:** Token JWT almacenado en `localStorage`
- **Rutas protegidas:** `beforeLoad` verifica token antes de renderizar

---

## Requisitos previos

- **Java 21** (recomendado: Eclipse Temurin 21)
- **Maven 3.9+** — descargar en https://maven.apache.org o instalar con `winget install Apache.Maven`
- **Node.js 18+**
- Cuenta en **Supabase** (https://supabase.com)

---

## Configuración inicial de la base de datos

### 1. Crear proyecto en Supabase

Crear un proyecto nuevo en https://supabase.com/dashboard

### 2. Ejecutar el esquema

En **Supabase → SQL Editor → New query**, ejecutar el contenido de `backend/src/main/resources/schema.sql`.
Si aparece el aviso de RLS, seleccionar **"Run without RLS"**.

### 3. Ejecutar la migración de usuarios

Ejecutar también `backend/migration_spring.sql` en el SQL Editor.

---

## Desarrollo local

### Backend

```cmd
cd backend

# 1. Configurar variables de entorno (cmd)
set PGHOST=aws-1-us-west-2.pooler.supabase.com
set PGPORT=5432
set PGDATABASE=postgres
set PGUSER=postgres.<TU_PROJECT_ID>
set PGPASSWORD=<TU_PASSWORD>
set DB_PARAMS=?sslmode=require
set JWT_SECRET=un-secreto-largo-de-al-menos-32-caracteres

# 2. Arrancar
C:\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

El backend queda disponible en `http://localhost:8088`.
El usuario admin se crea automáticamente en el primer arranque.

### Frontend

```cmd
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

**Credenciales por defecto:** `admin@mdfarmasalud.com` / `Admin123!`

---

## Variables de entorno

### Backend

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PGHOST` | Host de Supabase Session Pooler | `aws-1-us-west-2.pooler.supabase.com` |
| `PGPORT` | Puerto del pooler | `5432` |
| `PGDATABASE` | Nombre de la base de datos | `postgres` |
| `PGUSER` | Usuario del pooler | `postgres.<project_id>` |
| `PGPASSWORD` | Contraseña de la base de datos | `tu_password` |
| `DB_PARAMS` | Parámetros extra de conexión | `?sslmode=require` |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 32 chars) | `secreto-largo-aleatorio` |
| `ADMIN_EMAIL` | Email del administrador inicial | `admin@mdfarmasalud.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | `Admin123!` |
| `ADMIN_FULLNAME` | Nombre completo del administrador | `Administrador` |
| `CORS_ORIGINS` | URLs del frontend separadas por coma | `https://farmasaludmd2026.vercel.app` |
| `APP_URL` | URL pública del propio backend (keep-alive) | `https://farmacia-backend-md4f.onrender.com` |
| `PORT` | Puerto del servidor (Render lo asigna automáticamente) | `8088` |

### Frontend

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `https://farmacia-backend-md4f.onrender.com` |

---

## Despliegue

### Backend en Render

El archivo `render.yaml` en la raíz configura el deploy automáticamente:
- Servicio tipo **Web Service** con Docker
- Variables de entorno de Supabase precargadas
- `autoDeploy: true` — cada push a `main` dispara un nuevo deploy

Para el primer deploy:
1. Conectar el repositorio en https://dashboard.render.com
2. Render detecta `render.yaml` y crea el servicio automáticamente
3. El admin inicial se crea en el primer arranque

### Frontend en Vercel

1. Importar el repositorio en https://vercel.com
2. Establecer **Root Directory** → `frontend`
3. Agregar variable de entorno: `VITE_API_URL` → URL del backend en Render
4. `vercel.json` incluye las reglas de rewrite para SPA

---

## Base de datos — Esquema

| Tabla | Descripción |
|---|---|
| `app_users` | Usuarios del sistema (admin / empleado) |
| `productos` | Inventario de medicamentos |
| `categorias` | Categorías de productos |
| `proveedores` | Proveedores |
| `clientes` | Clientes de la farmacia |
| `ventas` | Cabecera de ventas |
| `detalle_ventas` | Ítems de cada venta |
| `compras` | Cabecera de compras a proveedores |
| `detalle_compras` | Ítems de cada compra |
| `cajas` | Sesiones de caja (apertura/cierre) |
| `auditoria` | Log de acciones del sistema |
| `configuracion` | Configuración general de la farmacia |

---

## API — Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Iniciar sesión |
| POST | `/api/auth/register` | Público | Crear cuenta de empleado |
| GET | `/api/health` | Público | Health check |
| GET | `/api/dashboard` | Empleado | Estadísticas del día |
| GET/POST | `/api/productos` | Empleado | Listar / crear productos |
| PUT/DELETE | `/api/productos/{id}` | Empleado | Actualizar / eliminar producto |
| GET/POST | `/api/ventas` | Empleado | Historial / registrar venta |
| GET/POST | `/api/compras` | Empleado | Historial / registrar compra |
| POST | `/api/caja/abrir` | Empleado | Abrir caja |
| POST | `/api/caja/{id}/cerrar` | Empleado | Cerrar caja |
| GET/POST | `/api/clientes` | Empleado | Listar / crear clientes |
| GET/POST | `/api/proveedores` | Empleado | Listar / crear proveedores |
| GET/POST | `/api/categorias` | Empleado | Listar / crear categorías |
| GET | `/api/usuarios` | Admin | Listar usuarios |
| PUT | `/api/usuarios/{id}` | Admin | Actualizar usuario |
| GET | `/api/reportes` | Admin | Reportes del sistema |
| GET/PUT | `/api/configuracion` | Admin | Ver / actualizar configuración |

---

## Licencia

Uso privado — MD FarmaSalud © 2026
