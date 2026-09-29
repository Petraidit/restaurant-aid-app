# Scripts

| Script | What it does | Exit 0 | Exit 1 |
|---|---|---|---|
| `build-and-scan.sh` | Builds both images, scans with Trivy | No fixable CRITICAL findings | A fixable CRITICAL finding exists |
| `backup-db.sh` | Backs up Postgres with `pg_dump` and verifies by restoring into a scratch database | Backup written and restore check passed | Postgres not running or backup failed |
| `healthcheck.py` | Checks the backend `/health` and the frontend page | Both services up | Either service down |

Run all scripts from anywhere; the shell scripts move to the project root themselves.
`healthcheck.py` accepts `--backend`, `--frontend`, `--retries` and `--delay`.
`backups/` is git-ignored because it contains user data.