# Route every packet destined outside the VPC from a public subnet to the Internet Gateway
resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_route_table_association" "rtb_to_public_subnet" {
  for_each = aws_subnet.public_subnets

  subnet_id      = each.value.id
  route_table_id = aws_route_table.rtb_public.id
}

# Route every packet destined outside the VPC from a private subnet through the NAT Gateway
resource "aws_route_table" "rtb_private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_nat.id
  }
}

resource "aws_route_table_association" "rtb_to_private_subnet" {
  for_each = aws_subnet.private_subnets

  subnet_id      = each.value.id
  route_table_id = aws_route_table.rtb_private.id
}