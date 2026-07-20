# OCI production infrastructure

This Terraform stack creates an OCI public DNS zone for `woxza.io`, its apex and `www` records, one public Ubuntu VM, a VCN/subnet, an internet gateway, a reserved public IP, and a network security group. Caddy terminates HTTPS and forwards requests to the application only over `127.0.0.1`. Only ports 80/443 are public; SSH must be limited to a trusted CIDR. PostgreSQL and Redis stay inside Docker and are not exposed by OCI networking.

## Bootstrap

1. Create an OCI Object Storage bucket for Terraform state and an API signing key for CI.
2. Copy `terraform.tfvars.example` to a private `terraform.tfvars` and set your tenancy values.
3. Export `TF_VAR_tenancy_ocid`, `TF_VAR_user_ocid`, `TF_VAR_api_key_fingerprint`, and `TF_VAR_api_private_key`; do not commit credentials.
4. Initialize with the corresponding OCI S3-compatible state backend:

   ```bash
   terraform init -backend-config=backend.hcl
   terraform plan
   ```

5. Apply only through the protected GitHub `production` environment, or with a reviewed local plan.

After apply, copy any existing DNS records (especially MX, SPF, DKIM, and verification records) into the OCI zone, then update the `woxza.io` nameservers at the registrar to OCI's nameservers for this zone. Do not delegate the zone first: that could interrupt mail delivery. Caddy obtains and renews the TLS certificate after the new A records resolve publicly.

Create `/srv/woxza-ai/.env.production` with production secrets, using `https://woxza.io` for `PUBLIC_API_URL`, `WEBSITE_URL`, and `CORS_ORIGINS`. Add the resulting IP, SSH key, and known-host fingerprint to the GitHub `production` environment for application deployment.
