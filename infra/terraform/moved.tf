# Records that these resources were renamed into modules, so Terraform
# updates its state instead of destroying and recreating them.
moved {
  from = aws_ecr_repository.app
  to   = module.ecr.aws_ecr_repository.app
}

moved {
  from = aws_ecr_lifecycle_policy.keep_last_10
  to   = module.ecr.aws_ecr_lifecycle_policy.keep_last
}

moved {
  from = aws_iam_openid_connect_provider.github
  to   = module.github_oidc.aws_iam_openid_connect_provider.github
}

moved {
  from = aws_iam_role.github_actions
  to   = module.github_oidc.aws_iam_role.push
}

moved {
  from = aws_iam_role_policy.ecr_push
  to   = module.github_oidc.aws_iam_role_policy.ecr_push

}

moved {
  from = aws_iam_role.github_deploy
  to   = module.eks_deploy_role.aws_iam_role.deploy
}

moved {
  from = aws_iam_role_policy.eks_describe
  to   = module.eks_deploy_role.aws_iam_role_policy.describe
}

moved {
  from = aws_eks_access_entry.github_deploy
  to   = module.eks_deploy_role.aws_eks_access_entry.deploy
}

moved {
  from = aws_eks_access_policy_association.github_deploy
  to   = module.eks_deploy_role.aws_eks_access_policy_association.deploy
}
