#!/bin/sh
# Convierte DATABASE_URL de Render (postgresql://user:pass@host:port/db)
# al formato JDBC que necesita Spring Boot, y extrae credenciales.
if [ -n "$DATABASE_URL" ]; then
  STRIPPED=$(echo "$DATABASE_URL" | sed 's|^postgresql://||')
  USERINFO=$(echo "$STRIPPED" | cut -d@ -f1)
  export SPRING_DATASOURCE_USERNAME=$(echo "$USERINFO" | cut -d: -f1)
  export SPRING_DATASOURCE_PASSWORD=$(echo "$USERINFO" | cut -d: -f2)
  export SPRING_DATASOURCE_URL="jdbc:${DATABASE_URL}?sslmode=require"
fi
exec java -jar /app/app.jar
