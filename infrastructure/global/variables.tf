variable "budget_alert_email" {
  type        = string
  description = "Email to send budget alerts to"
}

variable "state_bucket_name" {
  type        = string
  description = "Bucket that will contain all the Terraform state files"
}
