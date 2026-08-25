resource "aws_subnet" "public_subnets" {
  for_each          = var.subnets.public
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key
}

resource "aws_subnet" "private_subnets" {
  for_each          = var.subnets.private
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key
}
