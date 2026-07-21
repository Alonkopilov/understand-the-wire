output "output_private_subnet_1" {
  description = "Private subnet"
  value       = aws_subnet.private_subnet_1.id
}