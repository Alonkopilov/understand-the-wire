provider "aws" {
  region  = "eu-central-1"
  profile = "personal"
  default_tags {
    tags = {
      managed_by  = "Terraform"
      environment = "Global"
    }
  }
}
