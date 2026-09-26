#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; source "$SCRIPT_DIR/lib-common.sh"; need_root; need_cmd nginx; need_cmd certbot
AVAILABLE="/etc/nginx/sites-available/$SYSTEM13_DOMAIN"; ENABLED="/etc/nginx/sites-enabled/$SYSTEM13_DOMAIN"; ACME_ROOT="/var/www/system13-acme"
[[ -f "$AVAILABLE" ]] || "$SCRIPT_DIR/nginx-setup.sh"
if ! getent ahosts "$SYSTEM13_DOMAIN" >/dev/null 2>&1; then die "$SYSTEM13_DOMAIN does not resolve yet; SSL not attempted."; fi
email_args=(--register-unsafely-without-email); if [[ -n "${SYSTEM13_CERTBOT_EMAIL:-}" ]]; then email_args=(--email "$SYSTEM13_CERTBOT_EMAIL" --no-eff-email); fi
log SSL "Requesting certificate for $SYSTEM13_DOMAIN using webroot mode"
certbot certonly --non-interactive --agree-tos "${email_args[@]}" --webroot -w "$ACME_ROOT" -d "$SYSTEM13_DOMAIN" --deploy-hook "nginx -t && systemctl reload nginx"
CERT_DIR="/etc/letsencrypt/live/$SYSTEM13_DOMAIN"; [[ -f "$CERT_DIR/fullchain.pem" && -f "$CERT_DIR/privkey.pem" ]] || die "Certificate files not found after certbot success."
BACKUP="$(mktemp)"; cp -a "$AVAILABLE" "$BACKUP"
cat > "$AVAILABLE" <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name $SYSTEM13_DOMAIN;
    location /.well-known/acme-challenge/ { root $ACME_ROOT; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $SYSTEM13_DOMAIN;
    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:1313;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" always;
}
CONF
ln -sfn "$AVAILABLE" "$ENABLED"
if ! nginx -t; then cp -a "$BACKUP" "$AVAILABLE"; rm -f "$BACKUP"; nginx -t || true; die "HTTPS vhost failed validation; previous SYSTEM 13 vhost restored."; fi
rm -f "$BACKUP"; systemctl reload nginx; log OK "HTTPS enabled: https://$SYSTEM13_DOMAIN"
