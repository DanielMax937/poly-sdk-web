#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-3010}"
APP_NAME="poly-sdk-web"

# Ensure pm2 is available (local or global)
if ! command -v pm2 &>/dev/null; then
  if [ -f "./node_modules/.bin/pm2" ]; then
    PM2="./node_modules/.bin/pm2"
  else
    echo "PM2 not found. Installing..."
    npm install pm2 --save-dev
    PM2="./node_modules/.bin/pm2"
  fi
else
  PM2="pm2"
fi

export PORT

if $PM2 describe "$APP_NAME" &>/dev/null; then
  echo "Restarting existing PM2 app..."
  $PM2 restart "$APP_NAME" --update-env
else
  echo "──────────────────────────────────────────"
  echo "  Poly SDK Web (Next.js) — PM2"
  echo ""
  echo "  URL:      http://127.0.0.1:${PORT}"
  echo "  Health:   http://127.0.0.1:${PORT}/api/health"
  echo "──────────────────────────────────────────"
  echo ""
  $PM2 start ecosystem.config.cjs
fi

echo ""
echo "✓ Service started via PM2"
echo ""
echo "Commands:"
echo "  Logs:   pm2 logs $APP_NAME"
echo "  Stop:   ./stop-bg.sh"
echo "  Status: pm2 status $APP_NAME"
echo ""
