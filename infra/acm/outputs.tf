output "output_certificate_arn" {
  description = "TLS certificate for the domain"
  value       = aws_acm_certificate.cert.arn
}