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
  source                = "./ec2"
  private_subnet_id     = module.network.output_private_subnet_1
  public_subnet_id      = module.network.output_public_subnet_1
  alb_sg                = module.network.output_alb_sg
  vpc_id                = module.network.output_vpc
  load_balancer_subnets = module.network.output_load_balancer_subnets
  private_ec2_sg        = module.network.output_private_ec2_sg
  tls_certificate       = module.acm.output_certificate_arn
}

module "acm" {
  source = "./acm"

  full_domain = var.full_domain
}