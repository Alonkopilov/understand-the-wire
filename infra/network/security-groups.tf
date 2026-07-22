resource "aws_security_group" "vpc_endpoint_sg" {
  name        = "allow_https"
  description = "Allow HTTPS inbound traffic to the VPC Endpoint from the private ec2 instances"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "allow_https" {
  security_group_id = aws_security_group.vpc_endpoint_sg.id
  cidr_ipv4         = aws_subnet.private_subnet_1.cidr_block
  from_port         = "443"
  ip_protocol       = "tcp"
  to_port           = "443"
}

resource "aws_security_group" "private_ec2_sg" {
  name        = "private-ec2-sg"
  description = "Allow HTTPS inbound traffic to the private ec2 instances"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "allow_https_inbound_traffic_from_vpc_endpoints" {
  security_group_id            = aws_security_group.private_ec2_sg.id
  description                  = "Allow HTTP inbound connections from the VPC Endpoints (SSM)"
  referenced_security_group_id = aws_security_group.vpc_endpoint_sg.id
  from_port                    = "443"
  ip_protocol                  = "tcp"
  to_port                      = "443"
}

resource "aws_vpc_security_group_ingress_rule" "allow_http_inbound_traffic_from_alb" {
  security_group_id            = aws_security_group.private_ec2_sg.id
  description                  = "Allow HTTP inbound connections from the ALB"
  referenced_security_group_id = aws_security_group.alb_sg.id
  from_port                    = "80"
  ip_protocol                  = "tcp"
  to_port                      = "80"
}

resource "aws_vpc_security_group_ingress_rule" "allow_https_inbound_traffic_from_alb" {
  security_group_id            = aws_security_group.private_ec2_sg.id
  description                  = "Allow HTTPS inbound connections from the ALB"
  referenced_security_group_id = aws_security_group.alb_sg.id
  from_port                    = "443"
  ip_protocol                  = "tcp"
  to_port                      = "443"
}

resource "aws_vpc_security_group_egress_rule" "allow_all_outbound_traffic" {
  security_group_id = aws_security_group.private_ec2_sg.id
  description       = "Allow outbound connections to everything"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}


resource "aws_security_group" "alb_sg" {
  name        = "allow_tcp_to_alb"
  description = "Allow tcp request to the Application Load Balancer"
  vpc_id      = aws_vpc.main.id
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