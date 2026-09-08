terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
    local = {
      source = "hashicorp/local"
    }
  }
}
