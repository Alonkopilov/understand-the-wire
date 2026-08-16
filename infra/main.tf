locals {
  vpc_cidr = "10.50.0.0/16"

  private_subnet_1_cidr = "10.50.1.0/24"
  public_subnet_1_cidr  = "10.50.2.0/24"

  private_subnet_2_cidr = "10.50.3.0/24"
  public_subnet_2_cidr  = "10.50.4.0/24"
}

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
    encrypt      = true
    region       = "eu-central-1"
    profile      = "personal"
  }
}

provider "aws" {
  region  = "eu-central-1"
  profile = "personal"
  default_tags {
    tags = {
      managed_by  = "Terraform"
      environment = "Production"
    }
  }
}

data "aws_caller_identity" "current" {}

output "aws_account" {
  value = data.aws_caller_identity.current
}

module "network" {
  source = "./network"

  vpc_cidr              = local.vpc_cidr
  private_subnet_1_cidr = local.private_subnet_1_cidr
  public_subnet_1_cidr  = local.public_subnet_1_cidr
  private_subnet_2_cidr = local.private_subnet_2_cidr
  public_subnet_2_cidr  = local.public_subnet_2_cidr
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
  github_token_arn      = module.ssm.output_github_token_arn
  user_data = templatefile("${path.module}/scripts/init-instance.sh.tpl", {
    oidc_bucket_name = "understand-the-wire-oidc-bucket"
    oidc_bucket_url  = "https://understand-the-wire-oidc-bucket.s3.eu-central-1.amazonaws.com"
    repo_owner       = var.repo_owner
    repo_name        = var.repo_name
    branch           = var.branch
  })
}

module "acm" {
  source = "./acm"

  full_domain        = var.domain
  validation_records = module.cloudflare.output_validation_records
}

module "cloudflare" {
  source          = "./cloudflare"
  account_id      = var.account_id
  zone_id         = var.zone_id
  api_token       = var.api_token
  alb_dns_name    = module.ec2.alb_dns_name
  acm_certificate = module.acm.output_certificate
}

module "ssm" {
  source = "./ssm"

  github_token = var.github_token
}

module "s3" {
  source = "./s3"
}

module "iam" {
  source = "./iam"

  oidc_provider_arn = module.s3.output_cluster_oidc_provider_arn
}