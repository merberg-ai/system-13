#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root
PURGE=false; [[ "${1:-}" == "--purge" ]] && PURGE=true
log INFO "Stopping SYSTEM 13; existing unrelated Nginx sites will not be modified."
systemctl disable --now system13.service >/dev/null 2>&1 || true; rm -f /etc/systemd/system/system13.service /usr/local/bin/system13ctl; systemctl daemon-reload
AVAILABLE="/etc/nginx/sites-available/$SYSTEM13_DOMAIN"; ENABLED="/etc/nginx/sites-enabled/$SYSTEM13_DOMAIN"; rm -f "$ENABLED"; if [[ -f "$AVAILABLE" ]]; then mv "$AVAILABLE" "$AVAILABLE.disabled.$(date +%Y%m%d-%H%M%S)"; fi
if command -v nginx >/dev/null 2>&1 && nginx -t; then systemctl reload nginx; else log WARN "Nginx config test failed after disabling vhost; nginx was not reloaded."; fi
if $PURGE; then rm -rf "$SYSTEM13_ROOT" "$SYSTEM13_CONFIG_DIR" "$SYSTEM13_DATA"; log WARN "SYSTEM 13 application/config/data purged. Let's Encrypt certificates were intentionally retained."; else log OK "Application disabled; repo, releases, config, data, and certificates retained."; fi
