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

variable "control_plane_instance_type" {
  type = string
}

variable "cloudflare_api_token" {
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


