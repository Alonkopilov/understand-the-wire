output "public_subnets" {
  description = "Public subnets (Availability Zone + ID)"
  value = {
    for az, subnet in aws_subnet.public_subnets :
    az => subnet.id
  }
}

output "private_subnets" {
  description = "Private subnets (Availability Zone + ID)"
  value = {
    for az, subnet in aws_subnet.private_subnets :
    az => subnet.id
  }
}

output "vpc_id" {
  description = "VPC"
  value       = aws_vpc.main.id
}

output "vpc_endpoint_sg_id" {
  value = aws_security_group.vpc_endpoint_sg.id
}