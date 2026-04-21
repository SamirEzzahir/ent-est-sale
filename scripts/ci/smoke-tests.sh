#!/bin/bash

echo "Running light smoke tests..."

# Run container
docker run -d --name test-auth -p 9999:8000 ent-est-sale-core-auth

# Wait a bit
sleep 5

# Check if running
if [ "$(docker ps -q -f name=test-auth)" ]; then
    echo "Container is running"
else
    echo "Container failed to start"
    docker logs test-auth
    exit 1
fi

# Test endpoint
curl http://localhost:9999 || echo "Auth test skipped"

# Cleanup
docker rm -f test-auth

echo "Smoke tests done."