# Restaurant Aid

Orders and bookings, sorted. A restaurant ordering platform where customers browse a menu and place orders, and an admin manages items and order statuses.

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, JWT authentication |
| Frontend | React, Vite, served by nginx |
| Database | PostgreSQL 16 |
| Containers | Docker, Docker Compose (multi-stage builds, non-root user, health checks) |
| Security | Trivy image scanning, pinned dependencies |
| Automation | Bash and Python scripts, GitHub Actions CI/CD |

## Features

- Register and log in (the first registered user becomes admin)
- Customers browse items, place orders and track status
- Admin adds items, views all orders and updates statuses

## Live demo

- App: http://acfcf6be4e8264c11bae5a4b34fb1ad8-294768457.eu-west-1.elb.amazonaws.com
- Hosted on Amazon EKS (Kubernetes 1.35, eu-west-1), images from Amazon ECR
- Demo customer login: <email> / <password>

## Delivery pipeline

Push to `main` → GitHub Actions runs tests → builds images → Trivy security gate → publishes to ECR through OIDC (no stored AWS keys) → manifests in `k8s/` deploy to EKS.

## Run it locally

Requires Docker with Compose.

1. Create a `.env` file in the project root:
```
   SECRET_KEY=<run: openssl rand -hex 32>
   POSTGRES_PASSWORD=<run: openssl rand -hex 24>
```
2. Start everything:
```
   docker compose up -d --build
```
3. Open http://localhost:8080 and register. The first account becomes admin.

## Scripts

See [scripts/README.md](scripts/README.md): `build-and-scan.sh` (build and security gate), `backup-db.sh` (verified Postgres backups), `healthcheck.py` (service checks).

## Project layout

```
app/backend     FastAPI service
app/frontend    React app
scripts/        Build, backup and health-check automation
docker-compose.yml
```

## Security notes

- Secrets live in `.env` and are never committed
- Images are scanned with Trivy; fixable CRITICAL findings fail the build
- Postgres is not exposed outside the Compose network
- Containers run as a non-root user