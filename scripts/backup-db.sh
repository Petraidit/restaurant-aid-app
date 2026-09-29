#!/usr/bin/env bash
# Back up the Postgres database to ./backups/ and verify it by restoring into a scratch DB.
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="backups"
KEEP=7
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/restaurant-$STAMP.sql.gz"
SCRATCH="restore_check"

if ! docker compose ps --status running --services | grep -qx postgres; then
  echo "ERROR: postgres service is not running. Start it with: docker compose up -d postgres" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "==> Dumping to $OUTFILE"
docker compose exec -T postgres pg_dump -U restaurant -d restaurant --no-owner | gzip > "$OUTFILE"

echo "==> Verifying by restoring into scratch database"
docker compose exec -T postgres psql -U restaurant -d postgres -q -c "DROP DATABASE IF EXISTS $SCRATCH;" -c "CREATE DATABASE $SCRATCH;"
gunzip -c "$OUTFILE" | docker compose exec -T postgres psql -U restaurant -d "$SCRATCH" -q -v ON_ERROR_STOP=1 > /dev/null
echo -n "users restored: "
docker compose exec -T postgres psql -U restaurant -d "$SCRATCH" -t -A -c "SELECT COUNT(*) FROM users;"
docker compose exec -T postgres psql -U restaurant -d postgres -q -c "DROP DATABASE $SCRATCH;"

echo "==> Pruning old backups (keeping $KEEP)"
ls -1t "$BACKUP_DIR"/restaurant-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm --

echo "Done: $OUTFILE"