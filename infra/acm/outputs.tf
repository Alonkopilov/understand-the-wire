output "output_certificate_arn" {
  description = "TLS certificate ARN for the domain"
  value       = aws_acm_certificate.cert.arn
}

output "output_certificate" {
  description = "TLS certificate for the domain"
  value       = aws_acm_certificate.cert
}