output "repository_arns" {
  value = { for k, r in aws_ecr_repository.app : k => r.arn }
}

output "repository_urls" {
  value = { for k, r in aws_ecr_repository.app : k => r.repository_url }
}
