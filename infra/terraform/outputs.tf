output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "github_actions_role_arn" {
  value = module.github_oidc.role_arn
}


output "github_deploy_role_arn" {
  value = module.eks_deploy_role.role_arn
}
