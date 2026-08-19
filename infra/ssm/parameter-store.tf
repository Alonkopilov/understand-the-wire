resource "aws_ssm_parameter" "github_token" {
  name        = "/production/github/token"
  description = "Fine grained Github token for FluxCD"
  type        = "SecureString"
  value       = var.github_token
}

resource "aws_ssm_parameter" "discord_webhook" {
  name        = "/production/discord/webhook"
  description = "Discord Webhook URL for FluxCD alerts"
  type        = "SecureString"
  value       = var.discord_webhook
}