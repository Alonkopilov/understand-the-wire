resource "cloudflare_worker" "proxy" {
  account_id = var.account_id
  name       = var.name
  observability = {
    enabled = var.enable_logs
  }
}

resource "cloudflare_worker_version" "proxy" {
  account_id         = var.account_id
  worker_id          = cloudflare_worker.proxy.id
  compatibility_date = "2026-09-08"
  main_module        = "${var.name}.mjs"
  modules = [{
    name           = "${var.name}.mjs"
    content_type   = "application/javascript+module"
    content_base64 = base64encode(var.code)
  }]
}

resource "cloudflare_workers_deployment" "proxy" {
  account_id  = var.account_id
  script_name = cloudflare_worker.proxy.name
  strategy    = "percentage"
  versions = [{
    percentage = 100
    version_id = cloudflare_worker_version.proxy.id
  }]
}

resource "cloudflare_workers_custom_domain" "name" {
  account_id = var.account_id
  zone_id    = var.zone_id

  hostname = var.hostname
  service  = cloudflare_worker.proxy.name

  depends_on = [cloudflare_workers_deployment.proxy]
}
