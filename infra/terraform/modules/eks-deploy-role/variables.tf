variable "cluster_name" {
  type = string
}

variable "namespace" {
  description = "Kubernetes namespace the role may deploy into"
  type        = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_subject" {
  type = string
}

variable "role_name" {
  type    = string
  default = "github-actions-eks-deploy"
}
