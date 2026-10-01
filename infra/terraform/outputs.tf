output "ecr_repository_urls" {
  value = { for k, r in aws_ecr_repository.app : k => r.repository_url }
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}
