terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }

    tls = {
      source  = "hashicorp/tls"
      version = "4.3.0"
    }
  }
}