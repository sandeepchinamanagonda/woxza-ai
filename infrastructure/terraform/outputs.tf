output "public_ip" {
  description = "Reserved public IP for the DNS A record and GitHub deployment host."
  value       = oci_core_public_ip.production.ip_address
}

output "instance_id" {
  value = oci_core_instance.production.id
}

output "dns_zone_id" {
  description = "OCI public DNS zone. Delegate woxza.io to its OCI nameservers at the registrar after copying any existing DNS records."
  value       = oci_dns_zone.public.id
}
