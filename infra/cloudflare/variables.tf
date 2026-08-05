variable "zone_id" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type      = string
  sensitive = true
}

variable "api_token" {
  type      = string
  sensitive = true
}

variable "alb_dns_name" {
  type        = string
  description = "The DNS name of the Application Load Balancer. CNAME record will be created and pointed at it."
}

variable "acm_certificate" {
  description = "The ACM certificate for the domain. I will need it to get the validation records"
}