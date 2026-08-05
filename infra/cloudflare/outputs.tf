output "output_validation_records" {
  description = "Cloudflare DNS validation records"
  value       = cloudflare_dns_record.validation
}