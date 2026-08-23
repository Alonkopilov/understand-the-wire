variable "name_prefix" {
  type        = string
  description = "Will prepend every resource name that needs one."
}

variable "namespace" {
  type = string
}

variable "service_account_name" {
  type = string
}

variable "policy" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_domain" {
  type = string
}