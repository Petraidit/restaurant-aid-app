variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "oidc_subject" {
  description = "Exact sub claim the role trust policies must match (see terraform.tfvars.example)"
  type        = string
}

variable "ecr_repositories" {
  type    = list(string)
  default = ["restaurant-aid-backend", "restaurant-aid-frontend"]
}

variable "role_name" {
  type    = string
  default = "github-actions-ecr-push"
}

variable "cluster_name" {
  type    = string
  default = "restaurant-aid-tf"
}

variable "k8s_namespace" {
  type    = string
  default = "restaurant-aid"
}


variable "enable_deploy_role" {
  description = "Create the pipeline deploy role and its access to the cluster. Turn off while the cluster does not exist."
  type        = bool
  default     = true
}
