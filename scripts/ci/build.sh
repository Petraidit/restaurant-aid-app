#!/usr/bin/env bash
# Helper steps for the build job.
# Usage: build.sh check-api-url | push-images
set -euo pipefail

check_api_url() {
  echo "API_URL is: ${API_URL:-<empty>}"
  case "${API_URL:-}" in
    http://* | https://*) ;;
    *)
      echo "::error::API_URL must start with http:// or https://"
      exit 1
      ;;
  esac
}

push_images() {
  : "${REGISTRY:?REGISTRY is required}"
  local tag="${GITHUB_SHA::7}"
  local svc repo existing
  for svc in backend frontend; do
    repo="restaurant-aid-${svc}"
    existing=$(aws ecr batch-get-image --repository-name "$repo" \
      --image-ids imageTag="$tag" --query 'images[0].imageId.imageTag' --output text)
    if [ "$existing" = "$tag" ]; then
      echo "${repo}:${tag} already exists, skipping push"
    else
      docker tag "${repo}:ci" "${REGISTRY}/${repo}:${tag}"
      docker push "${REGISTRY}/${repo}:${tag}"
    fi
  done

}

case "${1:-}" in
  check-api-url) check_api_url ;;
  push-images) push_images ;;
  *)
    echo "usage: build.sh check-api-url | push-images" >&2
    exit 2
    ;;
esac
