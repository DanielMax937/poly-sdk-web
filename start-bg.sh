#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-3010}"
PID_FILE="${POLY_SDK_WEB_PID_FILE:-./poly-sdk-web.pid}"
LOG_FILE="${POLY_SDK_WEB_LOG_FILE:-./poly-sdk-web.log}"

if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Port $PORT already in use. Stop the service first with: ./stop-bg.sh"
  exit 1
fi

echo "──────────────────────────────────────────"
echo "  Poly SDK Web (Next.js)"
echo ""
echo "  URL:      http://127.0.0.1:${PORT}"
echo "  Health:   http://127.0.0.1:${PORT}/api/health"
echo "  Log file: $LOG_FILE"
echo "──────────────────────────────────────────"

export PORT
export NODE_OPTIONS="--dns-result-order=ipv4first ${NODE_OPTIONS:-}"
nohup npm run dev >> "$LOG_FILE" 2>&1 &
SERVICE_PID=$!
echo $SERVICE_PID > "$PID_FILE"

echo ""
echo "✓ Service started (PID: $SERVICE_PID)"
echo ""
echo "Commands:"
echo "  View logs:  tail -f $LOG_FILE"
echo "  Stop:       ./stop-bg.sh"
