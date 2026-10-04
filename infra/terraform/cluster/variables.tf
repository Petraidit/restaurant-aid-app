variable "cluster_name" {
  description = "EKS cluster name (must differ from any existing cluster in the account)"
  type        = string
  default     = "restaurant-aid-tf"
}
