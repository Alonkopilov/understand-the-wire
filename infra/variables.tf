variable "zone_id" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type      = string
  sensitive = true
}

variable "domain" {
  type        = string
  description = "The endpoint that will point to the Load Balancer, used to create a TLS certificate"
}

variable "api_token" {
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