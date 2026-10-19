# Rebuild runbook

How to bring the system up from nothing. There are two layers.

- Long-lived, in `infra/terraform`: ECR repositories, the GitHub OIDC push role,
  the EKS deploy role, and the ACM certificate. The certificate has
  `prevent_destroy`, so a plain `terraform destroy` there fails on purpose.
- Disposable, in `infra/terraform/cluster`: the VPC and the EKS cluster.
  It has its own state.

## What survives a teardown

- The ACM certificate and its validation CNAME at Truehost. Never delete the CNAME.
- ECR repositories and images, the push role, the repo variables and secrets.
- The domain and the names app., api. and grafana.

## Rebuild

1. Create the cluster:

       cd infra/terraform/cluster
       terraform init
       terraform apply

2. Connect kubectl:

       aws eks update-kubeconfig --name restaurant-aid-tf --region eu-west-1

3. Cluster-scoped storage, once per cluster:

       kubectl apply -f k8s/storageclass.yaml

4. Namespace and secrets (never overwrites existing secrets):

       bash scripts/bootstrap-secrets.sh

5. Database. The pipeline does not apply it, and the backend needs it:

       kubectl apply -f k8s/postgres.yaml
       kubectl -n restaurant-aid rollout status statefulset/postgres

   A new cluster means an empty database. Restore from `scripts/backup-db.sh`
   output if data is needed.

6. Turn the deploy role on. In `infra/terraform/terraform.tfvars` set
   `enable_deploy_role = true`, then:

       cd infra/terraform
       terraform apply

7. Repo settings (Settings, Secrets and variables, Actions, Variables):
   - `API_URL` = `https://api.restaurantaid.name.ng`
   - `AWS_DEPLOY_ROLE_ARN` = the deploy role ARN:
     `terraform -chdir=infra/terraform output -raw github_deploy_role_arn`
   - `DEPLOY_ENABLED` = `true`

8. Deploy: run the "App CI/CD" workflow manually (workflow_dispatch) or push to main.

9. Create three CNAME records at Truehost, one per load balancer:

       app      -> hostname of the frontend Service
       api      -> hostname of the backend Service
       grafana  -> hostname of the grafana Service

   Hostnames: `kubectl -n restaurant-aid get svc`. The pipeline step
   "Check the DNS records match the load balancers" prints the exact records.
   Names are relative to the zone, with no trailing dot.

10. Verify:

        curl -sI http://app.restaurantaid.name.ng | head -1    # 301 to https
        curl -sI https://app.restaurantaid.name.ng | head -1   # 200
        curl -sI https://api.restaurantaid.name.ng | head -1
        kubectl -n restaurant-aid get secret grafana-admin \
          -o jsonpath='{.data.password}' | base64 -d; echo     # Grafana admin password

    Grafana at https://grafana.restaurantaid.name.ng shows dashboards
    read-only without a login.

## Tear down

1. Set `DEPLOY_ENABLED` to `false` in the repo variables.
2. Back up the database (the cluster has no docker compose, so use kubectl):

       kubectl -n restaurant-aid exec postgres-0 -- \
         pg_dump -U restaurant -d restaurant --no-owner \
         > backups/k8s-live-$(date +%F-%H%M).sql
3. Delete the namespace, so Kubernetes removes the AWS load balancers.
   If they are left behind they block the VPC from being destroyed:

       kubectl delete ns restaurant-aid
       aws elbv2 describe-load-balancers --region eu-west-1 \
         --query 'LoadBalancers[].LoadBalancerName'     # wait until empty
       aws elb describe-load-balancers --region eu-west-1 \
         --query 'LoadBalancerDescriptions[].LoadBalancerName'

4. Set `enable_deploy_role = false` in `infra/terraform/terraform.tfvars` and
   run `terraform apply` in `infra/terraform`.
5. Destroy the cluster layer:

       cd infra/terraform/cluster
       terraform destroy

6. Delete the app, api and grafana CNAMEs at Truehost, since they now point
   at load balancers that no longer exist. Keep the `_...acm-validations`
   CNAME.

## Why these choices

- TLS ends at the AWS load balancers with the ACM certificate. Pods serve
  plain HTTP inside the cluster.
- HSTS is one day for now. Raise it once the setup is stable.
- The certificate lives in the long-lived layer so its ARN, which is written
  into the k8s manifests, never changes.
