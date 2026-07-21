resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  depends_on = [aws_internet_gateway.gw]

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_route_table_association" "rtb_to_public_subnet_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table" "rtb_private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_nat.id
  }

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_route_table_association" "rtb_to_private_subnet_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.rtb_private.id
}