#!/usr/bin/env bash
set -euo pipefail
SYSTEM13_ROOT="${SYSTEM13_ROOT:-/opt/system13}"
SYSTEM13_REPO="$SYSTEM13_ROOT/repo"
SYSTEM13_REPO_URL="${SYSTEM13_REPO_URL:-https://github.com/merberg-ai/system-13.git}"
SYSTEM13_BRANCH="${SYSTEM13_BRANCH:-main}"
[[ ${EUID:-$(id -u)} -eq 0 ]] || { echo "[FAIL] Run with sudo/root." >&2; exit 1; }
for cmd in git node npm curl nginx systemctl; do command -v "$cmd" >/dev/null 2>&1 || { echo "[FAIL] Required command missing: $cmd" >&2; exit 1; }; done
major="$(node -p 'Number(process.versions.node.split(".")[0])')"; (( major >= 22 )) || { echo "[FAIL] Node.js 22+ required; found $(node -v)." >&2; exit 1; }
mkdir -p "$SYSTEM13_ROOT"
if [[ ! -d "$SYSTEM13_REPO/.git" ]]; then echo "[GIT] Cloning SYSTEM 13 ($SYSTEM13_BRANCH)..."; git clone --branch "$SYSTEM13_BRANCH" --single-branch "$SYSTEM13_REPO_URL" "$SYSTEM13_REPO"; else echo "[GIT] Existing repository found; refreshing $SYSTEM13_BRANCH..."; git -C "$SYSTEM13_REPO" fetch origin "$SYSTEM13_BRANCH"; git -C "$SYSTEM13_REPO" checkout "$SYSTEM13_BRANCH"; git -C "$SYSTEM13_REPO" merge --ff-only "origin/$SYSTEM13_BRANCH"; fi
printf '%s\n' "$SYSTEM13_BRANCH" > "$SYSTEM13_ROOT/channel"
exec env SYSTEM13_BRANCH="$SYSTEM13_BRANCH" "$SYSTEM13_REPO/scripts/deploy.sh" --install
