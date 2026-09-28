#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib-common.sh
source "$SCRIPT_DIR/lib-common.sh"
need_root
for cmd in git node npm curl systemctl install; do need_cmd "$cmd"; done
check_node
NODE_BIN="$(readlink -f "$(command -v node)")"
[[ "$NODE_BIN" != /home/* && "$NODE_BIN" != /root/* ]] || die "Node.js must be installed system-wide for the hardened systemd service (found $NODE_BIN)."
[[ -d "$SYSTEM13_REPO/.git" ]] || die "Repository not found at $SYSTEM13_REPO"

INSTALL_MODE=false
[[ "${1:-}" == "--install" ]] && INSTALL_MODE=true
SHA="$(git -C "$SYSTEM13_REPO" rev-parse HEAD)"
SHORT="${SHA:0:12}"
RELEASE="$SYSTEM13_RELEASES/$SHA"
PREVIOUS="$(current_release)"

if [[ -n "$PREVIOUS" ]]; then
  log RELEASE "Current release: $PREVIOUS"
else
  log RELEASE "No valid previous release detected."
fi

log BUILD "Testing and building $SHORT"
cd "$SYSTEM13_REPO"
npm install --no-package-lock
npm run check
npm run scenarios:validate
npm test
npm run build
npm run smoke:production

if ! id system13 >/dev/null 2>&1; then
  useradd --system --home "$SYSTEM13_DATA" --shell /usr/sbin/nologin system13
fi
install -d -o root -g root -m 0755 "$SYSTEM13_ROOT" "$SYSTEM13_RELEASES"
install -d -o root -g system13 -m 0750 "$SYSTEM13_CONFIG_DIR"
install -d -o system13 -g system13 -m 0750 "$SYSTEM13_DATA" "$SYSTEM13_DATA/backups"

if [[ ! -f "$SYSTEM13_CONFIG" ]]; then
  install -o root -g system13 -m 0640 "$SYSTEM13_REPO/config.example.yaml" "$SYSTEM13_CONFIG"
  log CONFIG "Created $SYSTEM13_CONFIG"
else
  log CONFIG "Preserving existing $SYSTEM13_CONFIG"
fi

if [[ ! -d "$RELEASE" ]]; then
  TMP="$SYSTEM13_RELEASES/.new-$SHA"
  rm -rf "$TMP"
  install -d -o root -g root -m 0755 "$TMP"
  cp -a dist VERSION package.json scenarios scripts tools packaging "$TMP/"
  chown -R root:root "$TMP"
  chmod -R a+rX "$TMP"
  mv "$TMP" "$RELEASE"
fi

sed "s#@NODE_BIN@#$NODE_BIN#g" "$SYSTEM13_REPO/packaging/system13.service" > /etc/systemd/system/system13.service
chmod 0644 /etc/systemd/system/system13.service
chown root:root /etc/systemd/system/system13.service
install -o root -g root -m 0755 "$SYSTEM13_REPO/tools/system13ctl" /usr/local/bin/system13ctl

if command -v systemd-analyze >/dev/null 2>&1; then
  systemd-analyze verify /etc/systemd/system/system13.service >/dev/null || die "system13.service failed systemd verification."
fi

ln -sfn "$RELEASE" "$SYSTEM13_ROOT/current.new"
mv -Tf "$SYSTEM13_ROOT/current.new" "$SYSTEM13_CURRENT"
systemctl daemon-reload
systemctl enable system13.service >/dev/null
systemctl reset-failed system13.service >/dev/null 2>&1 || true
systemctl restart system13.service

if ! health_check; then
  log FAIL "New release failed health check."
  show_service_diagnostics
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" && "$PREVIOUS" != "$RELEASE" ]]; then
    log ROLLBACK "Restoring $PREVIOUS"
    ln -sfn "$PREVIOUS" "$SYSTEM13_ROOT/current.new"
    mv -Tf "$SYSTEM13_ROOT/current.new" "$SYSTEM13_CURRENT"
    systemctl restart system13.service
    if ! health_check; then
      show_service_diagnostics
      die "Rollback release also failed health check."
    fi
    log ROLLBACK "Previous release restored and healthy."
  else
    log WARN "No valid previous release is available for rollback."
  fi
  exit 1
fi
log OK "SYSTEM 13 $SHORT healthy on 127.0.0.1:1313"

if $INSTALL_MODE; then
  "$SYSTEM13_REPO/scripts/nginx-setup.sh"
  if command -v certbot >/dev/null 2>&1; then
    "$SYSTEM13_REPO/scripts/ssl-setup.sh" || log WARN "SSL setup did not complete; HTTP vhost remains available. Run: system13ctl ssl setup"
  else
    log WARN "certbot not found; SSL skipped. Existing Nginx was otherwise left intact."
  fi
fi
