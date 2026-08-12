resource "aws_acm_certificate" "cert" {
  domain_name       = var.full_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn = aws_acm_certificate.cert.arn

  validation_record_fqdns = [for record in var.validation_records : record.name]
}