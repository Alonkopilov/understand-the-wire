output "output_private_subnet_1" {
  description = "Private subnet"
  value       = aws_subnet.private_subnet_1.id
}

output "output_public_subnet_1" {
  description = "Public subnet"
  value       = aws_subnet.public_subnet_1.id
}

output "output_alb_sg" {
  description = "Security Group for the Application Load Balancer"
  value       = aws_security_group.alb_sg.id
}

output "output_vpc" {
  description = "VPC"
  value       = aws_vpc.main.id
}

output "output_load_balancer_subnets" {
  description = "Subnets to be used for the Application Load Balancer"
  value       = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

output "output_private_ec2_sg" {
  description = "The security group to attach to private ec2"
  value       = aws_security_group.private_ec2_sg.id
}