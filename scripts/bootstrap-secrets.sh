#!/usr/bin/env bash
# Creates the namespace and secrets a fresh cluster needs.
# Never overwrites an existing secret: changing app-secrets on a live cluster
# would break database authentication.
set -euo pipefail
NS=restaurant-aid

kubectl get ns "$NS" >/dev/null 2>&1 || kubectl create ns "$NS"

if kubectl -n "$NS" get secret app-secrets >/dev/null 2>&1; then
  echo "app-secrets already exists, leaving it unchanged"
else
  kubectl -n "$NS" create secret generic app-secrets \
    --from-literal=SECRET_KEY="$(openssl rand -hex 32)" \
    --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=')"
fi

if kubectl -n "$NS" get secret grafana-admin >/dev/null 2>&1; then
  echo "grafana-admin already exists, leaving it unchanged"
else
  kubectl -n "$NS" create secret generic grafana-admin \
    --from-literal=password="$(openssl rand -base64 18 | tr -d '/+=')"
fi
