output "secrets" {
  description = "Secret mapping from name to Parameter Store name"
  value = merge(
    { for k, v in aws_ssm_parameter.global : k => v.name },
    { for k, v in aws_ssm_parameter.environment : k => v.name }
  )
}
