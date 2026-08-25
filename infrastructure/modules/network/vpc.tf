resource "aws_vpc" "main" {
  cidr_block           = var.vpc
  instance_tenancy     = "default"
  enable_dns_support   = true
  enable_dns_hostnames = true
}