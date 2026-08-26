variable "name_prefix" {
  type        = string
  description = "Will prepend every resource name that needs one."
}

variable "github_token" {
  type      = string
  sensitive = true
}

variable "discord_webhook" {
  type      = string
  sensitive = true
}

variable "grafana_name" {
  type      = string
  sensitive = true
}

variable "grafana_password" {
  type      = string
  sensitive = true
}

variable "github_packages_token" {
  type      = string
  sensitive = true
}