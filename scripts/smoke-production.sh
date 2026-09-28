#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${SYSTEM13_SMOKE_PORT:-13131}"
TMP_CONFIG="$(mktemp)"
TMP_LOG="$(mktemp)"
PID=""

cleanup() {
  if [[ -n "$PID" ]] && kill -0 "$PID" >/dev/null 2>&1; then
    kill "$PID" >/dev/null 2>&1 || true
    wait "$PID" >/dev/null 2>&1 || true
  fi
  rm -f "$TMP_CONFIG" "$TMP_LOG"
}
trap cleanup EXIT INT TERM

sed "s/^  port: .*/  port: $PORT/" config.example.yaml > "$TMP_CONFIG"

SYSTEM13_CONFIG="$TMP_CONFIG" \
SYSTEM13_MAINTENANCE_FILE="$(dirname "$TMP_CONFIG")/system13-no-maintenance" \
node dist/server/index.cjs >"$TMP_LOG" 2>&1 &
PID=$!

for _ in {1..30}; do
  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "[FAIL] Production daemon exited during smoke test." >&2
    cat "$TMP_LOG" >&2
    exit 1
  fi

  if response="$(curl -fsS "http://127.0.0.1:$PORT/health" 2>/dev/null)"; then
    if [[ "$response" == *'"status":"ok"'* && "$response" == *'"service":"system13"'* ]]; then
      echo "[OK] Production daemon smoke test passed on 127.0.0.1:$PORT"
      exit 0
    fi
    echo "[FAIL] Unexpected health response: $response" >&2
    cat "$TMP_LOG" >&2
    exit 1
  fi

  sleep 0.2
done

echo "[FAIL] Production daemon did not become healthy during smoke test." >&2
cat "$TMP_LOG" >&2
exit 1
