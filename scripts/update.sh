#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root; need_cmd git
if [[ -f "$SYSTEM13_ROOT/channel" ]]; then SYSTEM13_BRANCH="$(cat "$SYSTEM13_ROOT/channel")"; fi
log GIT "Updating branch $SYSTEM13_BRANCH"; git -C "$SYSTEM13_REPO" fetch origin "$SYSTEM13_BRANCH"; git -C "$SYSTEM13_REPO" checkout "$SYSTEM13_BRANCH"; git -C "$SYSTEM13_REPO" merge --ff-only "origin/$SYSTEM13_BRANCH"
exec env SYSTEM13_BRANCH="$SYSTEM13_BRANCH" "$SYSTEM13_REPO/scripts/deploy.sh"
