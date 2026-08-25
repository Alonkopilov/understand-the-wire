output "github_token_arn" {
  type  = string
  value = aws_ssm_parameter.github_token.arn
}

output "discord_webhook_arn" {
  type  = string
  value = aws_ssm_parameter.discord_webhook.arn
}