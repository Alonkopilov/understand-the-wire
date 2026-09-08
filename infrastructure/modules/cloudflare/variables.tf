variable "zone_id" {
  type      = string
  sensitive = true
}

variable "alb_dns_name" {
  type        = string
  description = "The DNS name of the Application Load Balancer. CNAME record will be created and pointed at it."
}

variable "validation_records" {
  description = "The validation records to create for the DNS name"
}

variable "domain" {
  type = string
}
