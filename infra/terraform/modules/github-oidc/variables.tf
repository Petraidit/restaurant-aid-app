variable "oidc_subject" {
  description = "Exact sub claim the trust policy must match"
  type        = string
}

variable "repository_arns" {
  description = "ECR repositories the role may push to"
  type        = list(string)
}

variable "role_name" {
  type    = string
  default = "github-actions-ecr-push"
}

variable "role_description" {
  type    = string
  default = "Lets GitHub Actions push images to the restaurant-aid ECR repositories. Trusted only for Petraidit/restaurant-aid-app on the main branch."
}

variable "policy_name" {
  type    = string
  default = "ecr-push-restaurant-aid"
}
