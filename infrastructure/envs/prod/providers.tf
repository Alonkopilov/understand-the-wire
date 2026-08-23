provider "aws" {
  region  = var.region
  profile = var.profile
  default_tags {
    tags = {
      managed_by  = "Terraform"
      environment = var.environment
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "tls" {}