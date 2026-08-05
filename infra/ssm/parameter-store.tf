resource "aws_ssm_parameter" "github_token" {
  name        = "/production/github/token"
  description = "Fine grained Github token for FluxCD"
  type        = "SecureString"
  value       = var.github_token
}