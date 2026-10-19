#!/usr/bin/env bash
# Deployment steps, kept in one place so the workflow reads as named steps.
# Usage: deploy.sh record-images | render | dry-run | apply | monitoring | verify-frontend | verify-dns | restore
set -euo pipefail

NS="${NAMESPACE:-restaurant-aid}"
TAG="${GITHUB_SHA::7}"

record_images() {
  local d img
  for d in backend frontend; do
    img=$(kubectl -n "$NS" get deploy "$d" \
      -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)
    echo "${d}=${img}" >> "$GITHUB_OUTPUT"
  done
}

render() {
  local f
  mkdir -p rendered
  for f in backend frontend availability; do
    sed -E "s#(restaurant-aid-(backend|frontend)):[A-Za-z0-9._-]+#\1:${TAG}#" \
      "k8s/${f}.yaml" > "rendered/${f}.yaml"
  done
  grep -h "image:" rendered/*.yaml
}

dry_run() {
  kubectl apply --dry-run=server \
    -f rendered/availability.yaml -f rendered/backend.yaml -f rendered/frontend.yaml \
    -f k8s/monitoring/
}

apply_app() {
  kubectl apply -f rendered/availability.yaml
  kubectl apply -f rendered/backend.yaml
  kubectl apply -f rendered/frontend.yaml
  kubectl -n "$NS" rollout status deployment/backend --timeout=240s
  kubectl -n "$NS" rollout status deployment/frontend --timeout=240s
}

monitoring() {
  kubectl -n "$NS" create configmap grafana-dashboards \
    --from-file=restaurant-aid.json=observability/dashboard.json \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl apply -f k8s/monitoring/
  kubectl -n "$NS" rollout status deployment/prometheus --timeout=180s
  kubectl -n "$NS" rollout status deployment/grafana --timeout=180s
}

verify_frontend() {
  local want="${EXPECTED_API_URL:-https://api.restaurantaid.name.ng}" found
  found=$(kubectl -n "$NS" exec deploy/frontend -- \
    sh -c "grep -rhoF '$want' /usr/share/nginx/html | head -1" || true)
  if [ -z "$found" ]; then
    echo "::error::The frontend was not built with $want. Fix the API_URL repository variable, then push a new commit."
    exit 1
  fi
  echo "frontend contains $found"
}

verify_dns() {
  local zone="restaurantaid.name.ng" pair name svc host got bad=0
  for pair in app:frontend api:backend grafana:grafana; do
    name="${pair%%:*}"
    svc="${pair##*:}"
    host=$(kubectl -n "$NS" get svc "$svc" \
      -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    got=$(curl -fsS -H 'accept: application/dns-json' \
      "https://dns.google/resolve?name=${name}.${zone}&type=CNAME" |
      jq -r '[.Answer[]? | select(.type==5) | .data][0] // ""' || true)
    got="${got%.}"
    if [ -z "$host" ]; then
      echo "::warning::${svc} has no load balancer hostname yet"
      bad=1
    elif [ "$got" != "$host" ]; then
      echo "::warning::Create at Truehost: CNAME  ${name}  ->  ${host}   (currently: ${got:-none})"
      bad=1
    else
      echo "${name}.${zone} -> ${host} OK"
    fi
  done
  if [ "$bad" -eq 1 ]; then
    echo "DNS does not match the current load balancers yet. Add or update the records above."
  fi
}

restore() {
  if [ -n "${PREVIOUS_BACKEND:-}" ]; then
    kubectl -n "$NS" set image deployment/backend backend="$PREVIOUS_BACKEND"
  fi
  if [ -n "${PREVIOUS_FRONTEND:-}" ]; then
    kubectl -n "$NS" set image deployment/frontend frontend="$PREVIOUS_FRONTEND"
  fi
}

case "${1:-}" in
  record-images) record_images ;;
  render) render ;;
  dry-run) dry_run ;;
  apply) apply_app ;;
  monitoring) monitoring ;;
  verify-frontend) verify_frontend ;;
  verify-dns) verify_dns ;;
  restore) restore ;;
  *)
    echo "usage: deploy.sh record-images|render|dry-run|apply|monitoring|verify-frontend|verify-dns|restore" >&2
    exit 2
    ;;
esac
