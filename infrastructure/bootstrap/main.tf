provider "aws" {
  region  = "eu-central-1"
  profile = "personal"
  default_tags {
    tags = {
      managed_by  = "Terraform"
      environment = "Global"
    }
  }
}

data "aws_caller_identity" "current" {}

output "aws_account" {
  value = data.aws_caller_identity.current
}