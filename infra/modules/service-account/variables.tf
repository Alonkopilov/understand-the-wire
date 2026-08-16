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
  type    = string
  default = "understand-the-wire-oidc-bucket.s3.eu-central-1.amazonaws.com"
}