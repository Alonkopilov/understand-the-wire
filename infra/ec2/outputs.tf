output "alb_dns_name" {
  type  = string
  value = aws_lb.alb.dns_name
}