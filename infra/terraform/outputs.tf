output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "github_actions_role_arn" {
  value = module.github_oidc.role_arn
}


output "github_deploy_role_arn" {
  value = try(module.eks_deploy_role[0].role_arn, null)
}

output "certificate_arn" {
  value = module.certificate.arn
}

output "certificate_validation_records" {
  value = module.certificate.validation_records
}
