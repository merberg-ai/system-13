#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo "[SETUP] Installing development dependencies..."
  npm install
fi

DEV_ROOT="$PWD/.tmp/dev"
DEV_PUBLIC="$DEV_ROOT/public"

mkdir -p "$DEV_PUBLIC"
ln -sfn "$PWD/client/index.html" "$DEV_PUBLIC/index.html"
ln -sfn "$PWD/client/styles.css" "$DEV_PUBLIC/styles.css"

export SYSTEM13_CONFIG="${SYSTEM13_CONFIG:-$PWD/config.example.yaml}"
export SYSTEM13_PUBLIC_DIR="$DEV_PUBLIC"

echo "[DEV] Building browser client and watching for changes..."
./node_modules/.bin/esbuild client/src/main.ts \
  --bundle \
  --outfile="$DEV_PUBLIC/app.js" \
  --format=esm \
  --target=es2022 \
  --sourcemap \
  --watch=forever &
CLIENT_WATCH_PID=$!

cleanup() {
  kill "$CLIENT_WATCH_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[DEV] SYSTEM 13"
echo "[DEV] Config: $SYSTEM13_CONFIG"
echo "[DEV] Public: $SYSTEM13_PUBLIC_DIR"
echo "[DEV] http://127.0.0.1:1313"
echo

npm run dev:server
