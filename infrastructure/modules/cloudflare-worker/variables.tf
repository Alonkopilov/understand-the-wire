variable "zone_id" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type      = string
  sensitive = true
}

variable "hostname" {
  type = string
}

variable "code" {
  type = string
}

variable "name" {
  type = string
}

variable "enable_logs" {
  type = bool
}
