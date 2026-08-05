output "output_github_token_arn" {
  type  = string
  value = aws_ssm_parameter.github_token.arn
}