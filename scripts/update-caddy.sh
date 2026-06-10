#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

HOST=${BERRY_HOST:-berry.local}
DEPLOY_ROOT=${BERRY_DEPLOY_ROOT:-/var/www/berry-os}
STATUS_FILE=${BERRY_STATUS_FILE:-/var/lib/berry-os/status/status.json}
CADDYFILE_PATH=${BERRY_CADDYFILE:-/etc/caddy/Caddyfile}
CONFIG_TARGET=${BERRY_CONFIG_TARGET:-$DEPLOY_ROOT/config.json}
DIST_TARGET=${BERRY_DIST_TARGET:-$DEPLOY_ROOT/dist}
SCRIPTS_TARGET=${BERRY_SCRIPTS_TARGET:-$DEPLOY_ROOT/scripts}

if [ ! -f "$REPO_ROOT/package.json" ]; then
  echo "Repository BerryOS non trovato: $REPO_ROOT" >&2
  exit 1
fi

if [ ! -f "$REPO_ROOT/public/config.json" ]; then
  echo "Config mancante: $REPO_ROOT/public/config.json" >&2
  exit 1
fi

echo "==> Build frontend"
cd "$REPO_ROOT"
npm run build

echo "==> Preparo cartelle deploy"
sudo mkdir -p "$DIST_TARGET" "$SCRIPTS_TARGET"
sudo mkdir -p "$(dirname "$STATUS_FILE")"
sudo mkdir -p "$(dirname "$CADDYFILE_PATH")"

echo "==> Aggiorno asset e script"
sudo rsync -a --delete "$REPO_ROOT/dist/" "$DIST_TARGET/"
sudo install -m 755 "$REPO_ROOT/scripts/write-status-json.sh" "$SCRIPTS_TARGET/write-status-json.sh"
sudo install -m 755 "$REPO_ROOT/scripts/generate-caddyfile.mjs" "$SCRIPTS_TARGET/generate-caddyfile.mjs"
sudo install -m 755 "$REPO_ROOT/scripts/update-caddy.sh" "$SCRIPTS_TARGET/update-caddy.sh"
sudo install -m 644 "$REPO_ROOT/public/config.json" "$CONFIG_TARGET"
sudo install -m 644 "$REPO_ROOT/deploy/systemd/berry-status.service" /etc/systemd/system/berry-status.service
sudo install -m 644 "$REPO_ROOT/deploy/systemd/berry-status.timer" /etc/systemd/system/berry-status.timer

echo "==> Genero stato iniziale"
sudo /bin/sh "$SCRIPTS_TARGET/write-status-json.sh" "$STATUS_FILE"

echo "==> Rigenero Caddyfile"
TMP_CADDYFILE=$(mktemp)
trap 'rm -f "$TMP_CADDYFILE"' EXIT INT TERM

node "$REPO_ROOT/scripts/generate-caddyfile.mjs" \
  --host "$HOST" \
  --dist "$DIST_TARGET" \
  --status-file "$STATUS_FILE" \
  --config "$CONFIG_TARGET" \
  > "$TMP_CADDYFILE"

sudo install -m 644 "$TMP_CADDYFILE" "$CADDYFILE_PATH"
sudo caddy validate --config "$CADDYFILE_PATH"

echo "==> Aggiorno servizi"
sudo systemctl daemon-reload
sudo systemctl enable --now berry-status.timer
sudo systemctl reload caddy

echo "Deploy completato."
