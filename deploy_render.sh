#!/usr/bin/env bash
set -euo pipefail

# deploy_render.sh
# Construye el JAR, construye y empuja la imagen Docker, y genera render.image.yaml
# Requiere: DOCKER_USERNAME, DOCKER_PASSWORD, (opcional) DOCKER_REPO, (opcional) IMAGE_TAG

if [ -z "${DOCKER_USERNAME:-}" ]; then
  echo "ERROR: DOCKER_USERNAME no definido"
  exit 1
fi
if [ -z "${DOCKER_PASSWORD:-}" ]; then
  echo "ERROR: DOCKER_PASSWORD no definido"
  exit 1
fi

DOCKER_REPO=${DOCKER_REPO:-${DOCKER_USERNAME}/farmacia-backend}
IMAGE_TAG=${IMAGE_TAG:-latest}
IMAGE=${DOCKER_REPO}:${IMAGE_TAG}

echo "[1/5] Compilando JAR (mvn)..."
mvn -f backend package -DskipTests

echo "[2/5] Construyendo imagen Docker: ${IMAGE}"
docker build -t "${IMAGE}" -f backend/Dockerfile backend

echo "[3/5] Logueando en Docker registry..."
echo "${DOCKER_PASSWORD}" | docker login --username "${DOCKER_USERNAME}" --password-stdin

echo "[4/5] Pushing image..."
docker push "${IMAGE}"

echo "[5/5] Generando render.image.yaml para desplegar usando la imagen publicada"
cat > render.image.yaml <<EOF
databases:
  - name: farmacia-db
    databaseName: farmacia
    user: farmaciauser
    plan: free

services:
  - type: web
    name: farmacia-backend
    plan: free
    image: ${IMAGE}
    envVars:
      - key: DB_HOST
        fromDatabase:
          name: farmacia-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: farmacia-db
          property: port
      - key: DB_USER
        fromDatabase:
          name: farmacia-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: farmacia-db
          property: password
      - key: DB_NAME
        fromDatabase:
          name: farmacia-db
          property: database
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_EMAIL
        value: admin@mdfarmasalud.com
      - key: ADMIN_PASSWORD
        value: Admin123!
      - key: ADMIN_FULLNAME
        value: Administrador
      - key: CORS_ORIGINS
        value: https://farmaciamdapp.vercel.app
EOF

echo "Listo. Archivo generado: render.image.yaml"
echo "Para desplegar en Render (UI): sube render.image.yaml como blueprint; o usa Render CLI si lo tienes."
echo "Ejemplo de uso (local):"
echo "  export DOCKER_USERNAME=mi_usuario"
echo "  export DOCKER_PASSWORD=mi_password"
echo "  export IMAGE_TAG=v1.0.0"
echo "  ./deploy_render.sh"

exit 0
