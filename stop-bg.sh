#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-3010}"
PID_FILE="${POLY_SDK_WEB_PID_FILE:-./poly-sdk-web.pid}"

if PID=$(lsof -ti:"$PORT" 2>/dev/null); then
  echo "Stopping Poly SDK Web on port $PORT (PID: $PID)..."
  echo "$PID" | xargs kill 2>/dev/null || true
  sleep 2
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    echo "Force stopping..."
    lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
  echo "✓ Service stopped"
  exit 0
fi

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping Poly SDK Web (PID: $PID)..."
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

echo "No process found on port $PORT. Service not running?"
