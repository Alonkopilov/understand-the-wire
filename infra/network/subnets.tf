data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    managed_by = "Terraform"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.50.4.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    managed_by = "Terraform"
  }
}