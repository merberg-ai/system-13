#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root
STAMP="$(date +%Y%m%d-%H%M%S)"; OUT="$SYSTEM13_DATA/backups/system13-$STAMP.tar.gz"
install -d -o system13 -g system13 -m 0750 "$SYSTEM13_DATA/backups"
items=(); [[ -d "$SYSTEM13_CONFIG_DIR" ]] && items+=("$SYSTEM13_CONFIG_DIR"); [[ -f "$SYSTEM13_DATA/maintenance" ]] && items+=("$SYSTEM13_DATA/maintenance")
if ((${#items[@]})); then tar -czf "$OUT" "${items[@]}"; else tar -czf "$OUT" --files-from /dev/null; fi
chmod 0640 "$OUT"; chown root:system13 "$OUT"; log OK "$OUT"
