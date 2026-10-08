module "ecr" {
  source       = "./modules/ecr"
  repositories = var.ecr_repositories
}

module "github_oidc" {
  source          = "./modules/github-oidc"
  oidc_subject    = var.oidc_subject
  role_name       = var.role_name
  repository_arns = values(module.ecr.repository_arns)
}

module "eks_deploy_role" {
  count             = var.enable_deploy_role ? 1 : 0
  source            = "./modules/eks-deploy-role"
  cluster_name      = var.cluster_name
  namespace         = var.k8s_namespace
  oidc_provider_arn = module.github_oidc.provider_arn
  oidc_subject      = var.oidc_subject
}
