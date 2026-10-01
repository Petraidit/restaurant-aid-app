# Infrastructure

Terraform is the source of truth for the infrastructure in this repo.

- `terraform/` : ECR repositories (immutable tags, scan on push, keep last 10), the GitHub OIDC provider, and the `github-actions-ecr-push` role with its inline policy. These resources were first created by hand, then imported into Terraform state; `terraform plan` reports no changes.
- `terraform/cluster/` : VPC and EKS cluster definition (Kubernetes 1.35, 2x t3.small nodes, EBS CSI driver). Validated and planned (58 resources) but not applied, because the running demo cluster was created earlier with eksctl.

State is stored locally. In production it would move to an S3 backend with locking.
