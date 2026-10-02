variable "cluster_name" {
  type    = string
  default = "restaurant-aid"
}

variable "k8s_namespace" {
  type    = string
  default = "restaurant-aid"
}

data "aws_eks_cluster" "app" {
  name = var.cluster_name
}

resource "aws_iam_role" "github_deploy" {
  name               = "github-actions-eks-deploy"
  description        = "Lets GitHub Actions on main deploy to the restaurant-aid namespace on EKS."
  assume_role_policy = data.aws_iam_policy_document.trust.json
}

data "aws_iam_policy_document" "eks_describe" {
  statement {
    actions   = ["eks:DescribeCluster"]
    resources = [data.aws_eks_cluster.app.arn]
  }
}

resource "aws_iam_role_policy" "eks_describe" {
  name   = "eks-describe-cluster"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.eks_describe.json

}

resource "aws_eks_access_entry" "github_deploy" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.github_deploy.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "github_deploy" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.github_deploy.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"

  access_scope {
    type       = "namespace"
    namespaces = [var.k8s_namespace]
  }

  depends_on = [aws_eks_access_entry.github_deploy]
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
