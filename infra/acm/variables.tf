variable "full_domain" {
  type        = string
  description = "The endpoint that will point to the Load Balancer, used to create a TLS certificate"
}

variable "validation_records" {
  type        = map(any)
  description = "Cloudflare DNS validation records"
}