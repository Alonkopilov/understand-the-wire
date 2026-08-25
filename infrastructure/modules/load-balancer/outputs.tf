output "alb_dns_name" {
  type  = string
  value = aws_lb.alb.dns_name
}

output "sg_id" {
  type  = string
  value = aws_security_group.alb_sg.id
}