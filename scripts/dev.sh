#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo "[SETUP] Installing development dependencies..."
  npm install
fi

export SYSTEM13_CONFIG="${SYSTEM13_CONFIG:-$PWD/config.example.yaml}"

echo "[DEV] SYSTEM 13"
echo "[DEV] Config: $SYSTEM13_CONFIG"
echo "[DEV] http://127.0.0.1:1313"
echo

exec npm run dev
