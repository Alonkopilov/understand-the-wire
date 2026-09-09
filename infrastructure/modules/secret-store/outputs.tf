output "global" {
  description = "Map of global secret key -> full SSM parameter name"
  value       = { for k, v in aws_ssm_parameter.global : k => v.name }
}

output "environment" {
  description = "Map of environment secret key -> full SSM parameter name"
  value       = { for k, v in aws_ssm_parameter.environment : k => v.name }
}
