terraform {
  backend "s3" {
    bucket       = "alonko-utw-state-bucket"
    key          = "environments/global/global.tfstate"
    use_lockfile = true
    encrypt      = true
    region       = "eu-central-1"
  }
}
