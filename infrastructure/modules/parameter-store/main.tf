resource "aws_ssm_parameter" "github_token" {
  name        = "${var.name_prefix}/github/token"
  description = "Fine grained Github token for FluxCD"
  type        = "SecureString"
  value       = var.github_token
}

resource "aws_ssm_parameter" "discord_webhook" {
  name        = "${var.name_prefix}/discord/webhook"
  description = "Discord Webhook URL for FluxCD alerts"
  type        = "SecureString"
  value       = var.discord_webhook
}

resource "aws_ssm_parameter" "grafana_name" {
  name        = "${var.name_prefix}/grafana/username"
  description = "Grafana username for admin dashboard"
  type        = "SecureString"
  value       = var.grafana_name
}

resource "aws_ssm_parameter" "grafana_password" {
  name        = "${var.name_prefix}/grafana/password"
  description = "Grafana password for admin dashboard"
  type        = "SecureString"
  value       = var.grafana_password
}