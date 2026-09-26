#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root
CURRENT="$(current_release)"; [[ -n "$CURRENT" ]] || die "No current release."; TARGET="${1:-}"
if [[ -n "$TARGET" ]]; then [[ -d "$SYSTEM13_RELEASES/$TARGET" ]] && TARGET="$SYSTEM13_RELEASES/$TARGET"; [[ -d "$TARGET" ]] || die "Release not found: $1"; else TARGET="$(find "$SYSTEM13_RELEASES" -mindepth 1 -maxdepth 1 -type d ! -path "$CURRENT" -printf '%T@ %p\n' | sort -nr | head -n1 | cut -d' ' -f2-)"; fi
[[ -n "$TARGET" ]] || die "No previous release is available."; log ROLLBACK "Switching to $TARGET"
ln -sfn "$TARGET" "$SYSTEM13_ROOT/current.new"; mv -Tf "$SYSTEM13_ROOT/current.new" "$SYSTEM13_CURRENT"; install -o root -g root -m 0755 "$TARGET/tools/system13ctl" /usr/local/bin/system13ctl; systemctl restart system13.service; health_check || die "Rolled-back release failed health check."; log OK "Rollback complete."
