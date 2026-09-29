#!/usr/bin/env bash
# Back up the SQLite database from the Docker volume to ./backups/
set -euo pipefail

cd "$(dirname "$0")/.."

VOLUME="restaurant-aid-app_backend-data"
BACKUP_DIR="backups"
KEEP=7
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="orders-$STAMP.db"

if ! docker volume inspect "$VOLUME" > /dev/null 2>&1; then
  echo "ERROR: volume $VOLUME not found. Run 'docker volume ls' and fix VOLUME." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "==> Backing up to $BACKUP_DIR/$OUTFILE"
docker run --rm \
  -v "$VOLUME":/data:ro \
  -v "$PWD/$BACKUP_DIR":/backup \
  python:3.12-slim \
  python -c "
import sqlite3
src = sqlite3.connect('file:/data/orders.db?mode=ro', uri=True)
dst = sqlite3.connect('/backup/$OUTFILE')
src.backup(dst)
dst.close()
src.close()
"

echo "==> Verifying"
docker run --rm -v "$PWD/$BACKUP_DIR":/backup:ro python:3.12-slim \
  python -c "
import sqlite3
con = sqlite3.connect('/backup/$OUTFILE')
print('integrity:', con.execute('PRAGMA integrity_check').fetchone()[0])
print('users:', con.execute('SELECT COUNT(*) FROM users').fetchone()[0])
"

echo "==> Pruning old backups (keeping $KEEP)"
ls -1t "$BACKUP_DIR"/orders-*.db | tail -n +$((KEEP + 1)) | xargs -r rm --

echo "Done: $BACKUP_DIR/$OUTFILE"