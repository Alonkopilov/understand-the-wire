resource "aws_security_group" "vpc_endpoint_sg" {
  name        = "${var.name_prefix}-allow-https"
  description = "Allow HTTPS inbound traffic to the VPC Endpoint from the private ec2 instances"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "allow_https" {
  for_each = aws_subnet.private_subnets

  security_group_id = aws_security_group.vpc_endpoint_sg.id
  cidr_ipv4         = each.value.cidr_block
  from_port         = "443"
  ip_protocol       = "tcp"
  to_port           = "443"
}