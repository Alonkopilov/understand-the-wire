module "state_bucket" {
  source = "../modules/state-bucket"

  name = var.state_bucket_name
}
