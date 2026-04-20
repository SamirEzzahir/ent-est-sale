#!/usr/bin/env bash
set -e

cd frontend

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if npm run | grep -q "build"; then
  npm run build
fi

if npm run | grep -q "lint"; then
  npm run lint || true
fi