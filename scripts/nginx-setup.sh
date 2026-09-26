#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root; need_cmd nginx
AVAILABLE="/etc/nginx/sites-available/$SYSTEM13_DOMAIN"; ENABLED="/etc/nginx/sites-enabled/$SYSTEM13_DOMAIN"; ACME_ROOT="/var/www/system13-acme"; BACKUP=""
install -d -o www-data -g www-data -m 0755 "$ACME_ROOT/.well-known/acme-challenge"
if [[ -f "$AVAILABLE" ]]; then BACKUP="$(mktemp)"; cp -a "$AVAILABLE" "$BACKUP"; fi
cat > "$AVAILABLE" <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name $SYSTEM13_DOMAIN;

    location /.well-known/acme-challenge/ {
        root $ACME_ROOT;
    }

    location / {
        proxy_pass http://127.0.0.1:1313;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
}
CONF
ln -sfn "$AVAILABLE" "$ENABLED"
if ! nginx -t; then log FAIL "Nginx rejected the SYSTEM 13 vhost; restoring previous state."; rm -f "$ENABLED"; if [[ -n "$BACKUP" ]]; then cp -a "$BACKUP" "$AVAILABLE"; ln -sfn "$AVAILABLE" "$ENABLED"; else rm -f "$AVAILABLE"; fi; nginx -t || true; rm -f "$BACKUP"; exit 1; fi
rm -f "$BACKUP"; systemctl reload nginx; log OK "HTTP vhost enabled for $SYSTEM13_DOMAIN"
