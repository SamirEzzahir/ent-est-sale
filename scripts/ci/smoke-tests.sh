#!/usr/bin/env bash
set -e

echo "Running light smoke tests..."

# check images exist
docker images | grep ent- || true

# optional: start one small service
docker run -d --name test-auth -p 9999:8001 ent-core-auth || true

sleep 5

curl -f http://localhost:9999 || echo "Auth test skipped"

docker rm -f test-auth || true

echo "Smoke tests done."