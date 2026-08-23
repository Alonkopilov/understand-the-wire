data "aws_ami" "control_plane_instance" {
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

resource "aws_iam_instance_profile" "control_plane_instance_profile" {
  name = "${var.name_prefix}-ec2-control-plane-instance-profile"
  role = aws_iam_role.control_plane_node_role.name
}

resource "aws_instance" "control-plane" {
  ami                  = data.aws_ami.control_plane_instance.id
  instance_type        = var.instance_type
  iam_instance_profile = aws_iam_instance_profile.control_plane_instance_profile.name

  primary_network_interface {
    network_interface_id = aws_network_interface.control_plane_node_interface.id
  }

  user_data = templatefile("${path.module}/init-control-plane.sh.tpl", {
    oidc_bucket_name         = var.oidc_bucket.name
    oidc_bucket_url          = var.oidc_bucket.url
    repo_owner               = var.git_repository.owner
    repo_name                = var.git_repository.name
    branch                   = var.git_repository.branch
    github_secret_parameter  = var.parameter_store_secrets_arn.github_token
    discord_secret_parameter = var.parameter_store_secrets_arn.discord_webhook
    flux_cluster_path        = var.flux_cluster_path
  })
}

resource "aws_network_interface" "control_plane_node_interface" {
  subnet_id       = var.subnet_id
  description     = "Connecting the control plance instance to the private subnet"
  security_groups = [aws_security_group.private_ec2_sg.id]
}