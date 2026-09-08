data "aws_caller_identity" "current" {}

output "aws_account" {
  value = data.aws_caller_identity.current
}
