resource "aws_eip" "nat_gateway" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main_nat" {
  allocation_id = aws_eip.nat_gateway.id

  # Place the NAT Gateway in the first public subnet.
  # We currently only have one NAT that serves two private subnets, one of them will need to cross
  # availability zones to reach the NAT, but its acceptable for now to minimize costs.
  subnet_id = values(aws_subnet.public_subnets)[0].id

  connectivity_type = "public"
  availability_mode = "zonal"

  tags = {
    managed_by : "Terraform"
  }

  depends_on = [aws_internet_gateway.gw]
}

