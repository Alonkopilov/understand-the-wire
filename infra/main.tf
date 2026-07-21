terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "alonko-state-bucket"
    key          = "root"
    use_lockfile = true
    region       = "eu-central-1"
    profile      = "personal"
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

module "ec2" {
  source            = "./ec2"
  private_subnet_id = module.network.output_private_subnet_1
}