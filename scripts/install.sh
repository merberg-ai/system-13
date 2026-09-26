#!/usr/bin/env bash
set -euo pipefail
SYSTEM13_ROOT="${SYSTEM13_ROOT:-/opt/system13}"
SYSTEM13_REPO="$SYSTEM13_ROOT/repo"
SYSTEM13_REPO_URL="${SYSTEM13_REPO_URL:-https://github.com/merberg-ai/system-13.git}"
SYSTEM13_BRANCH="${SYSTEM13_BRANCH:-main}"

[[ ${EUID:-$(id -u)} -eq 0 ]] || { echo "[FAIL] Run with sudo/root." >&2; exit 1; }

install_basic_dependencies() {
  local missing=()
  for cmd in git curl tar sha256sum awk; do command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd"); done
  ((${#missing[@]} == 0)) && return 0

  if command -v apt-get >/dev/null 2>&1; then
    echo "[SETUP] Installing missing base packages: ${missing[*]}"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y git curl ca-certificates xz-utils coreutils gawk tar
  else
    echo "[FAIL] Missing required commands: ${missing[*]}" >&2
    echo "       Automatic dependency setup currently supports apt-based hosts." >&2
    exit 1
  fi
}

node_major() {
  node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0
}

bootstrap_node() {
  local major=0
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    major="$(node_major)"
    if (( major >= 22 )); then
      echo "[NODE] Using host runtime: $(command -v node) ($(node -v))"
      return 0
    fi
  fi

  local machine arch base tmp sums archive expected actual extracted target
  machine="$(uname -m)"
  case "$machine" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "[FAIL] No usable Node.js 22+ runtime found and automatic runtime bootstrap does not support architecture: $machine" >&2
      echo "       Install Node.js 22+ and npm manually, then rerun the installer." >&2
      exit 1
      ;;
  esac

  echo "[NODE] Installing private Node.js 22 runtime for linux-$arch under $SYSTEM13_ROOT/runtime"
  mkdir -p "$SYSTEM13_ROOT/runtime"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  base="https://nodejs.org/dist/latest-v22.x"
  sums="$tmp/SHASUMS256.txt"
  curl -fsSL "$base/SHASUMS256.txt" -o "$sums"
  archive="$(awk -v arch="$arch" '$2 ~ ("^node-v[0-9.]+-linux-" arch "\\.tar\\.xz$") { print $2; exit }' "$sums")"
  [[ -n "$archive" ]] || { echo "[FAIL] Unable to locate Node.js linux-$arch archive." >&2; exit 1; }
  expected="$(awk -v file="$archive" '$2 == file { print $1; exit }' "$sums")"
  curl -fsSL "$base/$archive" -o "$tmp/$archive"
  actual="$(sha256sum "$tmp/$archive" | awk '{print $1}')"
  [[ "$actual" == "$expected" ]] || { echo "[FAIL] Node.js archive checksum mismatch." >&2; exit 1; }

  tar -xJf "$tmp/$archive" -C "$tmp"
  extracted="${archive%.tar.xz}"
  target="$SYSTEM13_ROOT/runtime/$extracted"
  rm -rf "$target"
  mv "$tmp/$extracted" "$target"
  ln -sfn "$target" "$SYSTEM13_ROOT/runtime/node.new"
  mv -Tf "$SYSTEM13_ROOT/runtime/node.new" "$SYSTEM13_ROOT/runtime/node"
  export PATH="$SYSTEM13_ROOT/runtime/node/bin:$PATH"
  echo "[NODE] Installed $(node -v) at $(command -v node)"
}

mkdir -p "$SYSTEM13_ROOT"
install_basic_dependencies
bootstrap_node

for cmd in git node npm curl nginx systemctl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "[FAIL] Required command missing: $cmd" >&2; exit 1; }
done
(( $(node_major) >= 22 )) || { echo "[FAIL] Node.js 22+ is still unavailable." >&2; exit 1; }

if [[ ! -d "$SYSTEM13_REPO/.git" ]]; then
  echo "[GIT] Cloning SYSTEM 13 ($SYSTEM13_BRANCH)..."
  git clone --branch "$SYSTEM13_BRANCH" --single-branch "$SYSTEM13_REPO_URL" "$SYSTEM13_REPO"
else
  echo "[GIT] Existing repository found; refreshing $SYSTEM13_BRANCH..."
  git -C "$SYSTEM13_REPO" fetch origin "$SYSTEM13_BRANCH"
  git -C "$SYSTEM13_REPO" checkout "$SYSTEM13_BRANCH"
  git -C "$SYSTEM13_REPO" merge --ff-only "origin/$SYSTEM13_BRANCH"
fi

printf '%s\n' "$SYSTEM13_BRANCH" > "$SYSTEM13_ROOT/channel"
exec env SYSTEM13_BRANCH="$SYSTEM13_BRANCH" PATH="$PATH" "$SYSTEM13_REPO/scripts/deploy.sh" --install
