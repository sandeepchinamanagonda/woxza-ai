# OCI production setup

This is a one-time setup on an OCI Compute VM running Ubuntu 22.04 or later.

1. Install Docker Engine and the Docker Compose plugin, then add the deploy user to the `docker` group.
2. Create a non-root `deploy` user and add its public SSH key to `~deploy/.ssh/authorized_keys`. The matching private key is stored in the GitHub `production` environment as `OCI_DEPLOY_SSH_KEY`.
3. Provision the VM with `infrastructure/terraform`. It installs Caddy, which terminates TLS for `woxza.io` and reverse-proxies only to `127.0.0.1:3456`. Clone is performed by cloud-init.
4. Create `/srv/woxza-ai/.env.production` from `deploy/production.env.example` and fill in real values. Keep `WEB_PORT=127.0.0.1:3456`; production Compose removes the PostgreSQL host port completely.
5. In GitHub, create the `production` environment. Restrict deployments to `main` and, if desired, add required reviewers. Add these environment secrets:
   - `OCI_DEPLOY_HOST`: VM public IP or DNS name
   - `OCI_DEPLOY_USER`: `deploy`
   - `OCI_DEPLOY_SSH_KEY`: private key for the deploy user
   - `OCI_DEPLOY_KNOWN_HOSTS`: output of `ssh-keyscan -H <your-host>` verified against the VM console
6. Add the environment variable `OCI_DEPLOY_PATH` with `/srv/woxza-ai`, and optionally `PRODUCTION_URL` with the public website URL.

Every push to `main` now runs tests, builds the frontend, starts the Docker Compose release on the VM, and checks `http://127.0.0.1:8787/health`. A failed health check reverts the checked-out code and rebuilds the previous release. Before the first deployment, delegate `woxza.io` to the OCI DNS zone after copying any existing MX, SPF, DKIM, and verification records.
