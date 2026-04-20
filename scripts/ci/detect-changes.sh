#!/usr/bin/env bash
set -e

BASE_COMMIT=$(git rev-parse HEAD~1 2>/dev/null || echo "")
CURRENT_COMMIT=$(git rev-parse HEAD)

if [ -z "$BASE_COMMIT" ]; then
  echo "true" > .ci_changed_frontend
  echo "all" > .ci_changed_backends
  exit 0
fi

CHANGED_FILES=$(git diff --name-only "$BASE_COMMIT" "$CURRENT_COMMIT")

FRONTEND_CHANGED="false"
BACKENDS=""
 
# Detect frontend changes
if echo "$CHANGED_FILES" | grep -q '^frontend/'; then
  FRONTEND_CHANGED="true"
fi

# Define your services (VERY IMPORTANT: correct syntax)
SERVICES="core-auth upload-service download-service admin-service ai-assistant-service course-service assignment-service grade-service notification-service schedule-service"

# Detect backend changes
for svc in $SERVICES; do
  if echo "$CHANGED_FILES" | grep -q "^backend/$svc/"; then
    BACKENDS="$BACKENDS $svc"
  fi
done

# Clean spaces
BACKENDS=$(echo "$BACKENDS" | xargs || true)

# Save results
echo "$FRONTEND_CHANGED" > .ci_changed_frontend
echo "$BACKENDS" > .ci_changed_backends

echo "Frontend changed: $FRONTEND_CHANGED"
echo "Backend changed: $BACKENDS"