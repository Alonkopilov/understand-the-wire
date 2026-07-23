data "aws_ami" "worker_instance" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "worker_role" {
  name               = "ec2-worker-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "worker_role_policy" {
  role       = aws_iam_role.worker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "worker_instance_profile" {
  name = "ec2-worker-instance-profile"
  role = aws_iam_role.worker_role.name
}

resource "aws_instance" "worker" {
  ami                  = data.aws_ami.worker_instance.id
  instance_type        = "t3.small"
  iam_instance_profile = aws_iam_instance_profile.worker_instance_profile.name

  # instance_market_options {
  #   market_type = "spot"
  #   spot_options {
  #     max_price = 0.01
  #   }
  # }

  primary_network_interface {
    network_interface_id = aws_network_interface.worker_instance_private_subnet_1.id
  }

  tags = {
    managed_by : "Terraform"
  }
}

resource "aws_network_interface" "worker_instance_private_subnet_1" {
  subnet_id       = var.private_subnet_id
  description     = "Connecting the worker instance to the private subnet"
  private_ips     = ["10.50.1.10"]
  security_groups = [var.private_ec2_sg]
  tags = {
    managed_by = "Terraform"
  }
}