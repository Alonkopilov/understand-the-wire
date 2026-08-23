output "certificate_arn" {
  description = "TLS certificate ARN for the domain"
  value       = aws_acm_certificate.cert.arn
}

output "validation_records" {
  description = "Validation DNS records to create"
  value       = aws_acm_certificate.cert.domain_validation_options
}