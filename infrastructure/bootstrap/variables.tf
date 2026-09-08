variable "budget_alert_email" {
  type        = string
  description = "Email to send budget alerts to"
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}

variable "domain" {
  type = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}
