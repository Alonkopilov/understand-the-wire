locals {
  name_prefix = "${var.project}-${var.environment}"
  env_domain  = var.environment == "prod" ? var.domain : "${var.environment}.${var.domain}"
}

# Constructs a VPC, private and public subnets, internet gateway and routing.
module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix

  vpc = "10.50.0.0/16"
  subnets = {
    private = {
      "eu-central-1a" = "10.50.1.0/24"
      "eu-central-1b" = "10.50.3.0/24"
    }
    public = {
      "eu-central-1a" = "10.50.2.0/24"
      "eu-central-1b" = "10.50.4.0/24"
    }
  }
}

# Constructs a public S3 bucket to host the OIDC files for the cluster.
# This will allow the cluster to use short-term credentials with IRSA.
module "cluster_oidc_issuer_bucket" {
  source = "../../modules/oidc-bucket"

  name = "${local.name_prefix}-oidc-bucket"
}

# Constructs an EC2 K3S control plane node - sets up the cluster with Flux connected
# to the Github repo, custom OIDC issuer in S3 and VPC Endpoints to communicate with
# AWS SSM Session Manager.
data "aws_ssm_parameter" "github_token" {
  name = "/${var.project}/global/github/token"
}

data "aws_ssm_parameter" "discord_webhook" {
  name = "/${var.project}/${var.environment}/discord/webhook"
}

module "control_plane_node" {
  source      = "../../modules/control-plane-node"
  name_prefix = local.name_prefix
  oidc_bucket = module.cluster_oidc_issuer_bucket.bucket
  parameter_store_secrets_arn = {
    discord_webhook = data.aws_ssm_parameter.discord_webhook.arn
    github_token    = data.aws_ssm_parameter.github_token.arn
  }
  git_repository = {
    name   = var.repo_name
    owner  = var.repo_owner
    branch = var.branch
  }
  flux_cluster_path  = "./k8s/clusters/${var.environment}"
  subnet_id          = module.network.private_subnets["eu-central-1a"]
  instance_type      = var.control_plane_instance_type
  vpc_endpoint_sg_id = module.network.vpc_endpoint_sg_id
  alb_sg_id          = module.alb.sg_id
  vpc_id             = module.network.vpc_id
}

# Creates a certificate in AWS for my domain. After this certificate gets validated
# using Cloudflare, I could have HTTPS connections with my load balancer.
module "acm" {
  source = "../../modules/acm"

  domain = local.env_domain
}

# Creates the DNS records for my domain + the validation records to verify the
# certificate created in AWS ACM
data "aws_ssm_parameter" "cloudflare_zone_id" {
  name = "/${var.project}/global/cloudflare/zone-id"
}
module "cloudflare_dns" {
  source = "../../modules/cloudflare"

  domain             = local.env_domain
  zone_id            = data.aws_ssm_parameter.cloudflare_zone_id.value
  alb_dns_name       = module.alb.alb_dns_name
  validation_records = module.acm.validation_records
}

# Makes terraform wait for the certificate to be validated.
resource "aws_acm_certificate_validation" "this" {
  certificate_arn = module.acm.certificate_arn

  validation_record_fqdns = [for record in module.cloudflare_dns.validation_records : record.name]
}

# Creates an internet-facing ALB that sits in given public subnets. The load balancer
# will redirect HTTP requests to HTTPS, 
module "alb" {
  source      = "../../modules/load-balancer"
  name_prefix = local.name_prefix

  vpc_id          = module.network.vpc_id
  subnets         = values(module.network.public_subnets)
  tls_certificate = aws_acm_certificate_validation.this.certificate_arn
  target_ids = {
    "control-plane" : module.control_plane_node.instance_id
  }
}

# Service accounts
module "external_secrets_sa" {
  source      = "../../modules/service-account"
  name_prefix = local.name_prefix

  service_account_name = "external-secrets"
  namespace            = "external-secrets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ],
        Resource = "*",
      },
    ]
  })

  oidc_provider_arn    = module.cluster_oidc_issuer_bucket.oidc_provider_arn
  oidc_provider_domain = module.cluster_oidc_issuer_bucket.oidc_provider_domain
}

module "server_sa" {
  source      = "../../modules/service-account"
  name_prefix = local.name_prefix

  service_account_name = "server-sa"
  namespace            = "understand-the-wire"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadNetworkAndLoadBalancer",
        Effect = "Allow",
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeRouteTables",
          "ec2:DescribeInstances",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetHealth",
          "acm:ListCertificates",
        ],
        Resource = "*",
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.region
          }
        }
      },
      {
        Sid      = "ReadCertificate",
        Effect   = "Allow",
        Action   = ["acm:DescribeCertificate"],
        Resource = module.acm.certificate_arn,
      },
    ]
  })

  oidc_provider_arn    = module.cluster_oidc_issuer_bucket.oidc_provider_arn
  oidc_provider_domain = module.cluster_oidc_issuer_bucket.oidc_provider_domain
}
