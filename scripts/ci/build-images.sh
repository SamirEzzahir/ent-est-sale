#!/usr/bin/env bash
set -e

FRONTEND_CHANGED="$1"
BACKEND_SERVICES="$2"
ACTION="${3:-build}"

REGISTRY="docker.io"
NAMESPACE="yourdockerhubuser"
TAG="${BUILD_NUMBER:-latest}"

build_image() {
  NAME=$1
  PATH_DIR=$2

  IMAGE="$REGISTRY/$NAMESPACE/$NAME:$TAG"

  echo "Building $IMAGE"
  docker build -t "$IMAGE" "$PATH_DIR"

  if [ "$ACTION" = "push" ]; then
    docker push "$IMAGE"
  fi
}

# frontend
if [ "$FRONTEND_CHANGED" = "true" ]; then
  build_image "ent-frontend" "./frontend"
fi

# backend services
if [ "$BACKEND_SERVICES" = "all" ]; then
  BACKEND_SERVICES="core-auth upload-service download-service admin-service ai-assistant-service course-service assignment-service grade-service notification-service schedule-service"
fi

for svc in $BACKEND_SERVICES; do
  build_image "ent-$svc" "./backend/$svc"
done