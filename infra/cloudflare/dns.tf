resource "cloudflare_dns_record" "validation" {
  for_each = {
    for dvo in var.acm_certificate.domain_validation_options :
    dvo.domain_name => dvo
  }

  zone_id = var.zone_id

  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  content = each.value.resource_record_value
  ttl     = 60
}

resource "cloudflare_dns_record" "alb" {
  zone_id = var.zone_id

  name    = "www"
  type    = "CNAME"
  content = var.alb_dns_name
  proxied = false
  ttl     = 60
}

resource "cloudflare_dns_record" "alb_grafana" {
  zone_id = var.zone_id

  name    = "grafana"
  type    = "CNAME"
  content = var.alb_dns_name
  proxied = false
  ttl     = 60
}