# MD FarmaSalud

Sistema de gestión para farmacias. Controla ventas, inventario, compras, caja y usuarios desde una sola plataforma.

**Stack:** Spring Boot 3.3 (backend) · React 19 + Vite (frontend) · Supabase PostgreSQL (base de datos)

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
pharmaflow-suite/
├── backend/          # Spring Boot — API REST + Spring Security JWT
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── .env.example
│   └── migration_spring.sql
└── frontend/         # React 19 + Vite — SPA
    ├── src/
    ├── vercel.json
    └── package.json
```

### Backend (Spring Boot)

- **Java 21** · Spring Boot 3.3 · Spring Security · Spring Data JPA
- **Autenticación:** JWT stateless — tokens en `Authorization: Bearer`
- **Roles:** `ADMIN` (acceso total) · `EMPLEADO` (acceso operativo)
- **Base de datos:** Supabase PostgreSQL vía JDBC (Transaction Pooler puerto 6543)
- **Stock:** gestionado transaccionalmente en `VentaService` y `CompraService`

### Frontend (React + Vite)

- **React 19** · TanStack Router · Axios · shadcn/ui · Tailwind CSS 4
- **Autenticación:** Token JWT almacenado en `localStorage`
- **Rutas protegidas:** `beforeLoad` verifica token antes de renderizar

---

## Inicio rápido

### 1. Preparar la base de datos

Ejecutar `backend/migration_spring.sql` en el **SQL Editor de Supabase**. Este script:
- Crea la tabla `app_users` (reemplaza Supabase Auth)
- Migra las FK de `ventas`, `compras`, `cajas`, `clientes` y `auditoria` hacia `app_users`
- Desactiva RLS en todas las tablas de la aplicación

### 2. Levantar el backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL, JWT_SECRET, etc.

# Con Maven
./mvnw spring-boot:run

# O con Docker
docker build -t farmacia-backend .
docker run --env-file .env -p 8080:8080 farmacia-backend
```

### 3. Levantar el frontend

```bash
cd frontend
npm install

# Crear .env.local
echo "VITE_API_URL=http://localhost:8080" > .env.local

npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173)

**Credenciales por defecto:** `admin@mdfarmasalud.com` / `Admin123!`

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | JDBC URL de Supabase (Transaction Pooler) | `jdbc:postgresql://HOST:6543/postgres?user=...` |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 32 chars) | `super-secreto-largo-y-aleatorio` |
| `ADMIN_EMAIL` | Email del administrador inicial | `admin@mdfarmasalud.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | `Admin123!` |
| `CORS_ORIGINS` | URLs del frontend separadas por coma | `https://tu-app.vercel.app` |
| `PORT` | Puerto del servidor (Render lo asigna solo) | `8080` |

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `https://tu-backend.onrender.com` |

---

## Despliegue

### Backend en Render

1. Crear un nuevo servicio **Web Service** en [Render](https://render.com)
2. Conectar el repositorio · seleccionar carpeta `backend/`
3. Render detecta el `Dockerfile` automáticamente
4. Agregar las variables de entorno del backend en el panel de Render
5. El admin inicial se crea en el primer arranque

### Frontend en Vercel

1. Importar el repositorio en [Vercel](https://vercel.com)
2. Establecer **Root Directory** → `frontend`
3. Agregar variable de entorno: `VITE_API_URL` → URL del backend en Render
4. `vercel.json` ya incluye las reglas de rewrite para SPA

---

## API — Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Iniciar sesión |
| POST | `/api/auth/register` | Público | Crear cuenta de empleado |
| GET | `/api/dashboard` | Empleado | Estadísticas del día |
| GET/POST | `/api/productos` | Empleado | Listar / crear productos |
| PUT/DELETE | `/api/productos/{id}` | Empleado | Actualizar / eliminar |
| GET/POST | `/api/ventas` | Empleado | Historial / registrar venta |
| GET/POST | `/api/compras` | Empleado | Historial / registrar compra |
| POST | `/api/caja/abrir` | Empleado | Abrir caja |
| POST | `/api/caja/{id}/cerrar` | Empleado | Cerrar caja |
| GET | `/api/usuarios` | Admin | Listar usuarios |
| GET | `/api/reportes` | Admin | Reportes del sistema |

---

## Licencia

Uso privado — MD FarmaSalud © 2025
