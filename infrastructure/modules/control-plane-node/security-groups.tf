resource "aws_security_group" "private_ec2_sg" {
  name        = "${var.name_prefix}-private-ec2-sg"
  description = "Allow HTTPS inbound traffic to the instance"
  vpc_id      = var.vpc_id
}

# resource "aws_vpc_security_group_ingress_rule" "allow_https_inbound_traffic_from_vpc_endpoints" {
#   security_group_id            = aws_security_group.private_ec2_sg.id
#   description                  = "Allow HTTP inbound connections from the VPC Endpoints (SSM)"
#   referenced_security_group_id = var.vpc_endpoint_sg_id
#   from_port                    = "443"
#   ip_protocol                  = "tcp"
#   to_port                      = "443"
# }

resource "aws_vpc_security_group_ingress_rule" "allow_http_inbound_traffic_from_alb" {
  security_group_id            = aws_security_group.private_ec2_sg.id
  description                  = "Allow HTTP inbound connections from the ALB"
  referenced_security_group_id = var.alb_sg_id
  from_port                    = "80"
  ip_protocol                  = "tcp"
  to_port                      = "80"
}

resource "aws_vpc_security_group_ingress_rule" "allow_https_inbound_traffic_from_alb" {
  security_group_id            = aws_security_group.private_ec2_sg.id
  description                  = "Allow HTTPS inbound connections from the ALB"
  referenced_security_group_id = var.alb_sg_id
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