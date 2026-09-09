locals {
  environment_secrets = {
    "discord_webhook" : {
      "name" : "/discord/webhook"
      "description" : "Discord Webhook URL for FluxCD alerts"
    }
    "grafana_name" : {
      "name" : "/grafana/username"
      "description" : "Grafana username for admin dashboard"
    }
    "grafana_password" : {
      "name" : "/grafana/password"
      "description" : "Grafana password for admin dashboard"
    }
  }

  global_secrets = {
    "github_token" : {
      "name" : "/github/token"
      "description" : "Fine grained Github token for FluxCD"
    }
    "github_packages_token" : {
      "name" : "/github/packages-token"
      "description" : "Token to read Github packages for Flux ImageRepositories"
    }
    "cloudflare_zone_id" : {
      "name" : "/cloudflare/zone-id"
      "description" : "Cloudflare zone ID"
    }
    "cloudflare_api_token" : {
      "name" : "/cloudflare/api-token"
      "description" : "Cloudflare API token"
    }
    "cloudflare_account_id" : {
      "name" : "/cloudflare/account-id"
      "description" : "Cloudflare Account ID"
    }
  }
}

resource "aws_ssm_parameter" "global" {
  for_each = local.global_secrets

  name        = "/${var.project}/global${each.value.name}"
  description = each.value.description
  type        = "SecureString"
  value       = "### SECRET ###"
  overwrite   = true
  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "environment" {
  for_each = local.environment_secrets

  name        = "/${var.project}/${var.environment}${each.value.name}"
  description = each.value.description
  type        = "SecureString"
  value       = "### SECRET ###"
  overwrite   = true
  lifecycle {
    ignore_changes = [value]
  }
}
