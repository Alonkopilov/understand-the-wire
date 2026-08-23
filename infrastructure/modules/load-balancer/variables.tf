variable "name_prefix" {
  type        = string
  description = "Will prepend every resource name that needs one."
}

variable "vpc_id" {
  type = string
}

variable "subnets" {
  type = list(string)
}

variable "tls_certificate" {
  type = string
}

variable "target_ids" {
  type = map(string)
}