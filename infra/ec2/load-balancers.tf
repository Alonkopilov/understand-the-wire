resource "aws_lb" "alb" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg]
  subnets            = var.load_balancer_subnets

  #   enable_deletion_protection = true
}

resource "aws_lb_target_group" "private_instance_tg" {
  name     = "private-instance-tg"
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
  target_group_arn = aws_lb_target_group.private_instance_tg.arn
  target_id        = aws_instance.worker.id
  port             = 80
}

resource "aws_lb_listener" "alb_listener" {
  load_balancer_arn = aws_lb.alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "alb_listener_tls" {
  load_balancer_arn = aws_lb.alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.tls_certificate

  depends_on = [var.tls_certificate]

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.private_instance_tg.arn
  }
}