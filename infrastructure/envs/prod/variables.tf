variable "environment" {
  type = string
}

variable "discord_webhook" {
  type      = string
  sensitive = true
}

variable "github_token" {
  type      = string
  sensitive = true
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

variable "control_plane_instance_type" {
  type = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}

variable "domain" {
  type = string
}

variable "profile" {
  type = string
}

variable "region" {
  type = string
}

variable "project" {
  type = string
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