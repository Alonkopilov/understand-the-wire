resource "aws_security_group" "alb_sg" {
  name        = "${var.name_prefix}-allow-tcp-to-alb"
  description = "Allow tcp requests to the Application Load Balancer"
  vpc_id      = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "allow_tcp_https" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = "443"
  ip_protocol       = "tcp"
  to_port           = "443"
}

resource "aws_vpc_security_group_ingress_rule" "allow_tcp_http" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = "80"
  ip_protocol       = "tcp"
  to_port           = "80"
}

resource "aws_vpc_security_group_egress_rule" "allow_tcp_https" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "allow_tcp_http" {
  security_group_id = aws_security_group.alb_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}