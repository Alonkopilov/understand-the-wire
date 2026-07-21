resource "aws_eip" "nat_gateway" {
  domain = "vpc"

  tags = {
    managed_by : "Terraform"
  }
}

resource "aws_nat_gateway" "main_nat" {
  allocation_id     = aws_eip.nat_gateway.id
  subnet_id         = aws_subnet.public_subnet_1.id
  connectivity_type = "public"
  availability_mode = "zonal"

  tags = {
    managed_by : "Terraform"
  }

  depends_on = [aws_internet_gateway.gw]
}

