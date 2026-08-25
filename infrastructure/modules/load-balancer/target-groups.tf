resource "aws_lb_target_group" "private_instance_tg" {
  name     = "${var.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"

  vpc_id = var.vpc_id

  health_check {
    path                = "/health"
    healthy_threshold   = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group_attachment" "alb_tg" {
  for_each         = var.target_ids
  target_group_arn = aws_lb_target_group.private_instance_tg.arn
  target_id        = each.value
  port             = 80
}
