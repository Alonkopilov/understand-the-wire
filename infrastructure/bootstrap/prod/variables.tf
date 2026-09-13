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

variable "repo_owner" {
  type = string
}

variable "repo_name" {
  type = string
}

variable "branch" {
  type = string
}
