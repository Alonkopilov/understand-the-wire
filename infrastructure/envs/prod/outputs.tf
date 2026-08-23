data "aws_caller_identity" "current" {}
output "aws_account" {
  value = data.aws_caller_identity.current
}

output "name_prefix" {
  value = local.name_prefix
}

output "parameter_name_prefix" {
  value = local.parameter_name_prefix
}