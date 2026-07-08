# Deploy Voxa on an OCI Compute instance

The Compose stack runs the Vue site, Node API, and PostgreSQL together. The API automatically applies the idempotent schema migration when it starts, and PostgreSQL data is retained in the `postgres_data` Docker volume.

## OCI setup

1. Create an Ubuntu 22.04 or 24.04 Compute instance and attach a reserved public IP.
2. In the subnet security list or Network Security Group, allow inbound TCP 80 and 443. Do **not** expose port 5432.
3. Install Docker Engine and the Docker Compose plugin on the instance.
4. Clone this repository and enter its directory.
5. Create the deployment environment:

   ```bash
   cp .env.docker.example .env
   nano .env
   ```

   Set a strong `POSTGRES_PASSWORD` and your real HTTPS origin in `CORS_ORIGINS`.

6. Build and start everything:

   ```bash
   docker compose up -d --build
   docker compose ps
   curl http://127.0.0.1/health
   ```

To deploy an update, pull the new code and run `docker compose up -d --build` again. The named database volume is preserved.

## Backups

Create a SQL backup from the running PostgreSQL container:

```bash
docker compose exec -T db pg_dump -U voxa -d voxa > voxa-backup.sql
```

For production, place an OCI Load Balancer or HTTPS reverse proxy in front of port 80 and schedule encrypted database backups to OCI Object Storage.
