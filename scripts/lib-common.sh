#!/usr/bin/env bash
set -euo pipefail
SYSTEM13_ROOT="${SYSTEM13_ROOT:-/opt/system13}"
SYSTEM13_REPO="${SYSTEM13_REPO:-$SYSTEM13_ROOT/repo}"
SYSTEM13_RELEASES="${SYSTEM13_RELEASES:-$SYSTEM13_ROOT/releases}"
SYSTEM13_CURRENT="${SYSTEM13_CURRENT:-$SYSTEM13_ROOT/current}"
SYSTEM13_CONFIG_DIR="${SYSTEM13_CONFIG_DIR:-/etc/system13}"
SYSTEM13_CONFIG="${SYSTEM13_CONFIG:-$SYSTEM13_CONFIG_DIR/config.yaml}"
SYSTEM13_DATA="${SYSTEM13_DATA:-/var/lib/system13}"
SYSTEM13_DOMAIN="${SYSTEM13_DOMAIN:-system13.kj6ywd.net}"
SYSTEM13_BRANCH="${SYSTEM13_BRANCH:-main}"
SYSTEM13_REPO_URL="${SYSTEM13_REPO_URL:-https://github.com/merberg-ai/system-13.git}"

if [[ -x "$SYSTEM13_ROOT/runtime/node/bin/node" ]]; then
  export PATH="$SYSTEM13_ROOT/runtime/node/bin:$PATH"
fi

log(){ printf '[%s] %s\n' "$1" "$2"; }
die(){ log FAIL "$1" >&2; exit 1; }
need_root(){ [[ ${EUID:-$(id -u)} -eq 0 ]] || die "Run this command as root (sudo)."; }
need_cmd(){ command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"; }
node_major(){ node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0; }
check_node(){ need_cmd node; local major; major="$(node_major)"; (( major >= 22 )) || die "Node.js 22+ is required (found $(node -v 2>/dev/null || echo none))."; }
health_check(){ local tries="${1:-40}"; for ((i=1;i<=tries;i++)); do if curl -fsS http://127.0.0.1:1313/health >/dev/null 2>&1; then return 0; fi; sleep .35; done; return 1; }

current_release(){
  [[ -L "$SYSTEM13_CURRENT" ]] || return 0
  local resolved
  resolved="$(readlink -e "$SYSTEM13_CURRENT" 2>/dev/null || true)"
  [[ -n "$resolved" && -d "$resolved" ]] || return 0
  printf '%s\n' "$resolved"
}

show_service_diagnostics(){
  log DIAG "system13.service status follows"
  systemctl --no-pager --full status system13.service 2>&1 || true
  log DIAG "recent system13.service journal follows"
  journalctl --no-pager -u system13.service -n 60 2>&1 || true
}
