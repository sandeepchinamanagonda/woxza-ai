variable "tenancy_ocid" {
  type      = string
  sensitive = true
}

variable "user_ocid" {
  type      = string
  sensitive = true
}

variable "api_key_fingerprint" {
  type      = string
  sensitive = true
}

variable "api_private_key" {
  type      = string
  sensitive = true
}

variable "region" {
  type        = string
  description = "OCI region, for example us-chicago-1."
}

variable "compartment_ocid" { type = string }

variable "domain_name" {
  type        = string
  default     = "woxza.io"
  description = "Apex domain served by this stack, without a protocol or trailing dot."

  validation {
    condition     = can(regex("^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$", var.domain_name))
    error_message = "domain_name must be a DNS name such as woxza.io."
  }
}

variable "availability_domain" {
  type        = string
  default     = null
  nullable    = true
  description = "Optional availability-domain override. Terraform selects the first available domain when omitted."
}

variable "ssh_public_key" {
  type        = string
  description = "Public key for the deploy user. Keep the private key only in GitHub Actions secrets."
}

variable "ssh_ingress_cidr" {
  type        = string
  description = "Trusted CIDR allowed to SSH to the VM; use your office/VPN CIDR, never 0.0.0.0/0."

  validation {
    condition     = var.ssh_ingress_cidr != "0.0.0.0/0"
    error_message = "SSH must be restricted to a trusted CIDR."
  }
}

variable "repository_url" {
  type        = string
  default     = "https://github.com/sandeepchinamanagonda/woxza-ai.git"
  description = "Read-only repository URL cloned during first boot."
}

variable "repository_branch" {
  type    = string
  default = "main"
}

variable "instance_shape" {
  type        = string
  default     = "VM.Standard.E2.1.Micro"
  description = "Use a shape available in the selected tenancy and availability domain."
}

variable "instance_display_name" {
  type    = string
  default = "woxza-production"
}
