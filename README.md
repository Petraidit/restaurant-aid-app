# Restaurant Aid

Orders and bookings, sorted. A restaurant ordering platform where customers browse a menu and place orders, and an admin manages items and order statuses.

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, JWT authentication, structured JSON logs, Prometheus metrics |
| Frontend | React, Vite, served by nginx |
| Database | PostgreSQL 16 |
| Containers | Docker, Docker Compose (multi-stage builds, non-root user, health checks) |
| Security | Trivy image scanning, pinned dependencies, GitHub OIDC (no stored AWS keys) |
| Automation | Bash and Python scripts, GitHub Actions CI/CD |
| Cloud | Amazon EKS (Kubernetes 1.35, 3 nodes across 3 availability zones), Amazon ECR |
| Infrastructure as code | Terraform: ECR, GitHub OIDC role, deploy role, VPC and EKS cluster |
| Observability | Prometheus, Grafana, alert rules, JSON request logs |

## Features

- Register and log in (the first registered user becomes admin)
- Customers browse items, place orders and track status
- Admin adds items, views all orders and updates statuses

## Live demo

- App: http://ab799594cf48b42ba8cb76c948246585-1309781131.eu-west-1.elb.amazonaws.com
- Hosted on Amazon EKS (Kubernetes 1.35, eu-west-1). The cluster is provisioned by Terraform (`infra/terraform/cluster`).
- Demo customer login: `Kybern@gmail.com` / `Kybern`

The demo runs over plain HTTP and may be taken offline after grading.


Architecture, audit criteria and evidence: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Infrastructure as code

Everything on AWS is defined in this repository. Details are in [infra/README.md](infra/README.md).

- `infra/terraform/`: modules for the ECR repositories (immutable tags, scan on push), the GitHub OIDC provider with its push role, and the namespace-scoped deploy role. These resources were first created by hand and adopted into Terraform with `import` and `moved` blocks.
- `infra/terraform/cluster/`: a VPC across 3 availability zones with a NAT gateway, and the EKS cluster with a managed node group (3 x t3.small) and the VPC CNI, kube-proxy, CoreDNS, metrics-server and EBS CSI add-ons.
- `k8s/`: application, autoscaling, disruption budgets and monitoring manifests, applied by the pipeline. The Postgres StatefulSet and StorageClass are applied by hand, because changing a StatefulSet restarts the database.
- Secrets are created by `scripts/bootstrap-secrets.sh` and are never committed.

## Delivery pipeline

Pull requests run lint, tests, build and scan. Pushes to `main` also deploy.

1. **Lint:** ruff, `terraform fmt` check, Kubernetes manifest validation, and a check of the `API_URL` variable
2. **Test:** backend tests
3. **Build, scan, publish:** both images are built once, scanned with Trivy (fixable CRITICAL findings fail the build), and pushed to ECR tagged with the commit SHA, using OIDC
4. **Deploy (main only):** the manifests are rendered with the new tag, validated against the cluster with a server-side dry run, applied, and the rollouts are awaited. Monitoring is deployed, and a check confirms the frontend points at this cluster's backend. If the rollout fails, the previous images are restored.

## Resilience

- Frontend and backend run 2 replicas, spread across availability zones
- Readiness and liveness probes on every workload, so failed pods are restarted and unready pods receive no traffic
- Horizontal Pod Autoscalers (2 to 3 replicas at 70% CPU) and PodDisruptionBudgets (at least 1 pod available)
- Resource requests and limits, rolling updates with no unavailable pods, and a short `preStop` delay

## Observability

- The backend logs one JSON line per request (method, path, status, duration, request ID)
- `/metrics` exposes request counts and latency histograms. Prometheus scrapes both backend pods.
- Four alert rules: backend down, instance down, high 5xx ratio, high p95 latency

- A Grafana dashboard is provisioned from `observability/dashboard.json`
- Prometheus and Grafana are not exposed publicly. Use `kubectl port-forward svc/prometheus 9090:9090` and `kubectl port-forward svc/grafana 3000:3000`.

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

See [scripts/README.md](scripts/README.md): `build-and-scan.sh` (build and security gate), `backup-db.sh` (verified Postgres backups), `healthcheck.py` (service checks). `bootstrap-secrets.sh` creates the namespace and secrets on a fresh cluster and never overwrites existing ones.

## Project layout

```
app/backend       FastAPI service (JSON logs, /metrics)
app/frontend      React app
k8s/              Kubernetes manifests: app, autoscaling, monitoring
infra/            Terraform: ECR, GitHub OIDC, deploy role, EKS cluster
observability/    Grafana dashboard
scripts/          Build, backup, health-check and secrets automation
docs/             Architecture walkthrough and evidence

.github/          CI/CD pipeline
docker-compose.yml
```

## Security notes

- Secrets live in `.env` (locally) and Kubernetes Secrets (on the cluster), and are never committed
- Images are scanned with Trivy; fixable CRITICAL findings fail the build
- CI authenticates to AWS through OIDC with roles limited to this repo's `main` branch, and the deploy role can only touch one Kubernetes namespace
- Postgres is not exposed outside the Compose network or the cluster
- Containers run as a non-root user

## Known limitations

- The demo uses plain HTTP; production would add a domain, an ACM certificate and HTTPS
- Postgres is a single pod on a single-zone disk; production would use RDS Multi-AZ
- Terraform state is stored locally; production would use an S3 backend with locking
- Alerts are visible in Prometheus only (no Alertmanager), and Prometheus keeps 24 hours of data on a temporary volume
- `/metrics` is reachable through the public API load balancer; production would restrict it to in-cluster scraping