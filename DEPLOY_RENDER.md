
# Despliegue mínimo: Frontend (Vercel) + Backend (Render) + PostgreSQL (Render blueprint)

Este archivo describe los pasos mínimos para dejar el repositorio listo solo con lo necesario:

- Frontend: carpeta `frontend` (deploy en Vercel)
- Backend: carpeta `backend` con `Dockerfile` (deploy en Render)
- Base de datos: creada por `render.yaml` como blueprint en Render

Resumen de cambios realizados

- Eliminadas configuraciones y archivos relacionados con despliegues no requeridos (Cloudflare/Wrangler y Supabase).
- Se añadió la creación de extensiones necesarias (`pgcrypto`, `uuid-ossp`) en `backend/migration_spring.sql`.
- `pom.xml` ajustado para habilitar el procesador de anotaciones de Lombok.

Pasos para desplegar

1) Subir el repo a GitHub (u otro Git provider) si aún no está.

2) En Render: aplicar el blueprint `render.yaml` (ya presente en la raíz del repo).

	- El blueprint creará la base de datos `farmacia-db` y el servicio `farmacia-backend`.
	- Render proporcionará las variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `CORS_ORIGINS`.

3) En Vercel: conectar el repo y desplegar la carpeta `frontend`.

	- Asegura que `vercel.json` y `package.json` dentro de `frontend` estén correctos.
	- Añade en Vercel la variable `VITE_API_URL` apuntando al URL público del backend en Render.

Validaciones post-despliegue

- Asegurar que la extensión `pgcrypto` (y `uuid-ossp` si se necesita) está disponible en la DB. Si no, ejecutar en el editor SQL de Render:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

- Si tu proyecto viene de Supabase y requiere migraciones, ejecutar `backend/migration_spring.sql` en el SQL editor del proveedor ANTES de arrancar el backend.

- Revisar logs del servicio en Render para errores de conexión y de inicialización de SQL.

Comandos locales útiles

Compilar JAR (opcional):

```bash
mvn -f backend package -DskipTests
```

Construir imagen Docker (requiere Docker local):

```bash
docker build -t farmacia-backend:local -f backend/Dockerfile backend
```

Ejecutar local (ejemplo):

```bash
docker run --rm -e DB_HOST=host -e DB_PORT=5432 -e DB_NAME=farmacia -e DB_USER=farmaciauser -e DB_PASSWORD=tu_password -e JWT_SECRET=secreto_largo -p 8080:8080 farmacia-backend:local
```

Notas

- `CREATE EXTENSION` puede requerir privilegios de superuser; si Render no permite la creación automática, usa el editor SQL de Render o contacta al soporte.

Siguientes pasos — elige una opción:

- **A)** Genero un script `deploy_render.sh` que hace build, tag y push a Docker Hub, y sugiere cómo actualizar `render.yaml` para usar la imagen del registry (requiere credenciales Docker Hub).
- **B)** Hago commits adicionales para eliminar archivos/configs extra que quieras quitar del repo.

Indica A o B para seguir.

