variable "private_subnet_id" {
  type = string
}

variable "public_subnet_id" {
  type = string
}

variable "alb_sg" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "load_balancer_subnets" {
  type = list(string)
}

variable "private_ec2_sg" {
  type = string
}

variable "tls_certificate" {
  type = string
}

variable "github_token_arn" {
  type = string
}

variable "user_data" {
  type = string
}

variable "discord_webhook_arn" {
  type = string
}