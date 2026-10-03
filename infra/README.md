# Infrastructure

Terraform is the source of truth for the cloud resources in this repo.

## `terraform/` (applied; `terraform plan` reports no changes)
- `modules/ecr`: ECR repositories (immutable tags, scan on push, keep last 10).
- `modules/github-oidc`: GitHub OIDC provider and the push role used by the pipeline to publish images.
- `modules/eks-deploy-role`: deploy role, restricted to the `restaurant-aid` namespace through an EKS access entry.
- `moved.tf`: records the move of the original flat resources into modules. These resources were first created by hand and imported into state.

## `terraform/cluster/` (validated and planned, not applied)
VPC across 3 AZs and an EKS cluster with 3 x t3.small nodes and the EBS CSI driver. The running demo cluster was created earlier with eksctl, so this definition documents the target setup and is not what built it.

## Applied by hand, not by Terraform or the pipeline
- The Postgres StatefulSet and StorageClass (`k8s/postgres.yaml`, `k8s/storageclass.yaml`): changing a StatefulSet restarts the database.
- Secrets (`app-secrets`, `grafana-admin`) are created with kubectl and never committed.

State is stored locally. In production it would move to an S3 backend with locking.
