#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo "[SETUP] Installing build dependencies..."
  npm install
fi

echo "[CHECK] TypeScript"
npm run check

echo "[BUILD] SYSTEM 13"
npm run build
