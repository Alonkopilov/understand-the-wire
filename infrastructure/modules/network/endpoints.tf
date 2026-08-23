data "aws_region" "current" {}

# Those VPC Endpoints are required for the SSM Agent installed in my EC2 instances
# to start a session with AWS SSM Session Manager
resource "aws_vpc_endpoint" "ssm_messages_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [for sub in aws_subnet.private_subnets : sub.id]

  security_group_ids = [
    aws_security_group.vpc_endpoint_sg.id
  ]
}

resource "aws_vpc_endpoint" "ssm_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.region}.ssm"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [for sub in aws_subnet.private_subnets : sub.id]

  security_group_ids = [
    aws_security_group.vpc_endpoint_sg.id
  ]
}

resource "aws_vpc_endpoint" "ec2_messages_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [for sub in aws_subnet.private_subnets : sub.id]

  security_group_ids = [
    aws_security_group.vpc_endpoint_sg.id
  ]
}