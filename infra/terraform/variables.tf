variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "github_repo" {
  description = "GitHub repo allowed to push images, as OWNER/REPO"
  type        = string
  default     = "Petraidit/restaurant-aid-app"
}

variable "oidc_subject" {
  description = "Exact sub claim the role trust policy must match"
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
