terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = "eu-central-1"
  profile = "personal"
}

data "aws_caller_identity" "current" {}

output "aws_account" {
  value = data.aws_caller_identity.current
}

module "network" {
  source = "./network"
}