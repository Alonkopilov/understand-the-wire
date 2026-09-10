variable "domain" {
  type = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "region" {
  type = string
}

variable "project" {
  type = string
}

variable "environment" {
  type = string
}
