#!/usr/bin/env bash
set -e

SERVICES="$1"

if [ -z "$SERVICES" ]; then
  echo "No backend services changed."
  exit 0
fi

for svc in $SERVICES; do
  echo "Checking backend/$svc"
  cd "backend/$svc"

  if [ -f requirements.txt ]; then
    python3 -m venv .venv
    . .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

    python -m py_compile $(find . -name "*.py") || exit 1

    if [ -d tests ]; then
      pytest || true
    fi

    deactivate
  fi

  cd - >/dev/null
done