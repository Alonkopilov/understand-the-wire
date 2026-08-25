output "instance_id" {
  type  = string
  value = aws_instance.control-plane.id
}