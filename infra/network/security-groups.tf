resource "aws_security_group" "allow_inbound_https_vpc_endpoint" {
  name        = "allow_https"
  description = "Allow HTTPS inbound traffic from private ec2 to the VPC Endpoint"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "allow_https" {
  security_group_id = aws_security_group.allow_inbound_https_vpc_endpoint.id
  cidr_ipv4         = aws_subnet.private_subnet_1.cidr_block
  from_port         = "443"
  ip_protocol       = "tcp"
  to_port           = "443"
}