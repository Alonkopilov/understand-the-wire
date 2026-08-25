variable "name_prefix" {
  type        = string
  description = "Will prepend every resource name that needs one."
}

variable "parameter_store_secrets_arn" {
  type = object({
    discord_webhook = string
    github_token    = string
  })
  description = "Parameter Store secrets the node need access to"
}

variable "vpc_id" {
  type = string
}

variable "oidc_bucket" {
  type = object({
    name = string
    url  = string
    arn  = string
  })
  description = "The OIDC files will be uploaded to this bucket"
}

variable "git_repository" {
  type = object({
    owner  = string
    name   = string
    branch = string
  })
  description = "Data for the repository Flux will listen to in the node (GitOps)"
}

variable "flux_cluster_path" {
  type        = string
  description = "The path in the git repository that points at the environment's flux configuration directory"
}

variable "instance_type" {
  type = string
}

variable "vpc_endpoint_sg_id" {
  type = string
}

variable "alb_sg_id" {
  type = string
}

variable "subnet_id" {
  type = string
}
