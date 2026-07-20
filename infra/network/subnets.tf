resource "aws_subnet" "private_subnet_1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.50.1.0/24"

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.50.2.0/24"

  tags = {
    managed_by = "Terraform"
  }
}