#!/usr/bin/env bash
set -euo pipefail

# OCI network security groups remain the cloud perimeter. These host rules
# ensure Caddy's public HTTP and HTTPS ports remain reachable after reboots
# when the OS firewall contains a final reject rule.
for port in 80 443; do
  if ! iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
  fi
done
