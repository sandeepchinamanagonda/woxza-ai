data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

data "oci_identity_availability_domains" "production" {
  compartment_id = var.tenancy_ocid
}

resource "oci_dns_zone" "public" {
  compartment_id = var.compartment_ocid
  name           = var.domain_name
  zone_type      = "PRIMARY"
  scope          = "GLOBAL"
}

resource "oci_core_vcn" "production" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.20.0.0/16"]
  display_name   = "woxza-production"
  dns_label      = "woxza"
}

resource "oci_core_internet_gateway" "production" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.production.id
  display_name   = "woxza-production-igw"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.production.id
  display_name   = "woxza-production-public"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.production.id
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.production.id
  display_name   = "woxza-production-private"

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.production.id
  cidr_block                 = "10.20.1.0/24"
  display_name               = "woxza-production-public"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.private.id]
  prohibit_public_ip_on_vnic = true
}

resource "oci_core_network_security_group" "web" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.production.id
  display_name   = "woxza-production-web"
}

resource "oci_core_network_security_group_security_rule" "ssh" {
  network_security_group_id = oci_core_network_security_group.web.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = var.ssh_ingress_cidr
  source_type               = "CIDR_BLOCK"
  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }
}

resource "oci_core_network_security_group_security_rule" "http" {
  network_security_group_id = oci_core_network_security_group.web.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
}

resource "oci_core_network_security_group_security_rule" "https" {
  network_security_group_id = oci_core_network_security_group.web.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_instance" "production" {
  compartment_id = var.compartment_ocid
  availability_domain = coalesce(
    var.availability_domain,
    data.oci_identity_availability_domains.production.availability_domains[0].name
  )
  display_name = var.instance_display_name
  shape        = var.instance_shape

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = false
    nsg_ids          = [oci_core_network_security_group.web.id]
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64gzip(templatefile("${path.module}/cloud-init.yaml.tftpl", {
      repository_url    = var.repository_url
      repository_branch = var.repository_branch
      ssh_public_key    = var.ssh_public_key
      caddyfile_base64  = base64encode(templatefile("${path.module}/caddyfile.tftpl", { domain_name = var.domain_name }))
      firewall_script   = file("${path.module}/assets/woxza-firewall.sh")
      firewall_service  = file("${path.module}/assets/woxza-firewall.service")
    }))
  }
}

data "oci_core_vnic_attachments" "production" {
  compartment_id = var.compartment_ocid
  instance_id    = oci_core_instance.production.id
}

data "oci_core_vnic" "production" {
  vnic_id = data.oci_core_vnic_attachments.production.vnic_attachments[0].vnic_id
}

data "oci_core_private_ips" "production" {
  vnic_id = data.oci_core_vnic.production.id
}

resource "oci_core_public_ip" "production" {
  compartment_id = var.compartment_ocid
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.production.private_ips[0].id
  display_name   = "woxza-production"
}

resource "oci_dns_rrset" "apex" {
  zone_name_or_id = oci_dns_zone.public.id
  domain          = "${var.domain_name}."
  rtype           = "A"

  items {
    domain = "${var.domain_name}."
    rdata  = oci_core_public_ip.production.ip_address
    rtype  = "A"
    ttl    = 300
  }
}

resource "oci_dns_rrset" "www" {
  zone_name_or_id = oci_dns_zone.public.id
  domain          = "www.${var.domain_name}."
  rtype           = "A"

  items {
    domain = "www.${var.domain_name}."
    rdata  = oci_core_public_ip.production.ip_address
    rtype  = "A"
    ttl    = 300
  }
}
