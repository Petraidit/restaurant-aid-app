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
| Cloud | Amazon ECR (images), Amazon EKS (Kubernetes) |

## Features

- Register and log in (the first registered user becomes admin)
- Customers browse items, place orders and track status
- Admin adds items, views all orders and updates statuses

## Live demo

- App: http://acfcf6be4e8264c11bae5a4b34fb1ad8-294768457.eu-west-1.elb.amazonaws.com
- Hosted on Amazon EKS (Kubernetes 1.35, eu-west-1), with images stored in Amazon ECR
- Demo customer login: `Kybern@gmail.com` / `Kybern`

The demo runs over plain HTTP and may be taken offline after grading.

## Delivery pipeline

Push to `main`, then GitHub Actions:

1. Runs the backend tests
2. Builds both Docker images
3. Scans them with Trivy (fixable CRITICAL findings fail the build)
4. Publishes them to ECR, tagged with the commit SHA, using OIDC (no stored AWS keys)

The Kubernetes manifests in `k8s/` (Postgres StatefulSet, backend and frontend Deployments with health probes, Secrets for credentials) deploy the images to EKS.

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
k8s/            Kubernetes manifests for EKS
scripts/        Build, backup and health-check automation
docker-compose.yml
```

## Security notes

- Secrets live in `.env` (locally) and Kubernetes Secrets (on the cluster), and are never committed
- Images are scanned with Trivy; fixable CRITICAL findings fail the build
- CI publishes to ECR through OIDC with a role limited to this repo's `main` branch
- Postgres is not exposed outside the Compose network or the cluster
- Containers run as a non-root user