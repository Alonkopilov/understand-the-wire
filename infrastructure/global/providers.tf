provider "aws" {
  region = "eu-central-1"
  default_tags {
    tags = {
      managed_by  = "Terraform"
      environment = "Global"
    }
  }
}
