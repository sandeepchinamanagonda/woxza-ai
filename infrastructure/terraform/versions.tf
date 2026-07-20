terraform {
  required_version = ">= 1.7.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 7.0"
    }
  }

  # CI configures this with the OCI Object Storage S3-compatible backend.
  # Run `terraform init -backend=false` for local validation without state.
  backend "s3" {}
}
