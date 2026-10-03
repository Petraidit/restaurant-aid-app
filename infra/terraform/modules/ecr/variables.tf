variable "repositories" {
  description = "ECR repository names"
  type        = list(string)
}

variable "keep_last_images" {
  description = "How many images each repository keeps"
  type        = number
  default     = 10
}
