module "secrets_store" {
  source = "../../modules/secret-store"

  project     = var.project
  environment = var.environment
}

module "snapshot_bucket_prod" {
  source = "../../modules/snapshot-bucket"

  name = "alonko-utw-snapshot-bucket-${var.environment}"
}

data "aws_ssm_parameter" "cloudflare_zone_id" {
  name       = module.secrets_store.secrets["cloudflare-zone-id"]
  depends_on = [module.secrets_store]
}

data "aws_ssm_parameter" "cloudflare_account_id" {
  name       = module.secrets_store.secrets["cloudflare-account-id"]
  depends_on = [module.secrets_store]
}

module "proxy_worker" {
  source = "../../modules/cloudflare-worker"

  name       = "utw-proxy-worker-${var.environment}"
  zone_id    = data.aws_ssm_parameter.cloudflare_zone_id.value
  account_id = data.aws_ssm_parameter.cloudflare_account_id.value
  hostname   = "www.${var.domain}"
  code = templatefile("${path.module}/scripts/main.mjs.tftpl", {
    snapshot_origin = "https://${module.snapshot_bucket_prod.domain}"
    live_origin     = "https://origin.${var.domain}"
  })
  enable_logs = true
}

# Github Actions OIDC
module "github_actions" {
  source = "../../modules/oidc-github"

  name   = "github-actions"
  branch = var.branch
  owner  = var.repo_owner
  repo   = var.repo_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow",
        Action   = "*",
        Resource = "*",
      },
      {
        Effect = "Deny",
        Action = [
          "iam:CreateUser",
          "iam:CreateAccessKey",
          "iam:AttachUserPolicy",
          "iam:PutUserPolicy",
          "organizations:*",
          "account:*"
        ],
        Resource = "*",
      },
    ]
  })
}
