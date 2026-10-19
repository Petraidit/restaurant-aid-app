variable "domain_name" {
  description = "Primary domain name for the certificate"
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional names covered by the certificate"
  type        = list(string)
  default     = []
}
