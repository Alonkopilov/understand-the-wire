terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}

resource "cloudflare_dns_record" "validation" {
  for_each = {
    for dvo in var.validation_records :
    dvo.domain_name => dvo
  }

  zone_id = var.zone_id

  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  content = each.value.resource_record_value
  ttl     = 60
}

locals {
  env_suffix = var.environment == "prod" ? "" : ".${var.environment}"
}

resource "cloudflare_dns_record" "alb" {
  zone_id = var.zone_id

  name    = "www${local.env_suffix}"
  type    = "CNAME"
  content = var.alb_dns_name
  proxied = false
  ttl     = 60
}

resource "cloudflare_dns_record" "alb_grafana" {
  zone_id = var.zone_id

  name    = "grafana${local.env_suffix}"
  type    = "CNAME"
  content = var.alb_dns_name
  proxied = false
  ttl     = 60
}
