#!/usr/bin/env bash
# Build both images and fail if any fixable CRITICAL vulnerability is found.
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGES=(restaurant-aid-app-backend restaurant-aid-app-frontend)
FAILED=0

echo "==> Building images"
docker compose build --pull

for image in "${IMAGES[@]}"; do
  echo "==> Scanning $image"
  if docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v trivy-cache:/root/.cache/ \
      aquasec/trivy:latest image \
      --no-progress --scanners vuln --timeout 30m \
      --severity CRITICAL --ignore-unfixed --exit-code 1 \
      "$image"; then
    echo "PASS: $image"
  else
    echo "FAIL: $image has fixable CRITICAL vulnerabilities"
    FAILED=1
  fi
done

exit $FAILED