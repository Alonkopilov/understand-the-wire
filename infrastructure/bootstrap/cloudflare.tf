resource "cloudflare_worker" "proxy" {
  account_id = var.cloudflare_account_id
  name       = "utw-proxy-worker"
  observability = {
    enabled = true
  }
}

resource "local_file" "proxy" {
  filename = "${path.module}/scripts/.generated/main.mjs"
  content = templatefile("${path.module}/scripts/main.mjs.tftpl", {
    snapshot_origin = "https://alonko-utw-snapshot-bucket.s3.eu-central-1.amazonaws.com"
    live_origin     = "https://origin.${var.domain}"
  })
}

resource "cloudflare_worker_version" "proxy" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.proxy.id
  compatibility_date = "2026-09-08"
  main_module        = "main.mjs"
  modules = [{
    name         = "main.mjs"
    content_type = "application/javascript+module"
    content_file = local_file.proxy.filename
  }]

  depends_on = [local_file.proxy]
}

resource "cloudflare_workers_deployment" "proxy" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.proxy.name
  strategy    = "percentage"
  versions = [{
    percentage = 100
    version_id = cloudflare_worker_version.proxy.id
  }]
}

resource "cloudflare_workers_custom_domain" "name" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id

  hostname = "www.${var.domain}"
  service  = cloudflare_worker.proxy.name

  depends_on = [cloudflare_workers_deployment.proxy]
}
