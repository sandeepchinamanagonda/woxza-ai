# Deploy Woxza on an OCI Compute instance

The Compose stack runs the Vue site, Node API, and PostgreSQL together. The API automatically applies the idempotent schema migration when it starts, and PostgreSQL data is retained in the `postgres_data` Docker volume.

## OCI setup

1. Apply `infrastructure/terraform` to create the Ubuntu VM, reserved public IP, OCI DNS zone, security group, Docker, and Caddy HTTPS reverse proxy.
2. Copy every existing DNS record needed for email and verification into the OCI DNS zone, then delegate `woxza.io` to the OCI nameservers at the registrar.
3. SSH as `deploy` and create the deployment environment:

   ```bash
   cp deploy/production.env.example .env.production
   nano .env.production
   ```

   Set a strong `POSTGRES_PASSWORD`, `ADMIN_API_TOKEN`, and `UNSUBSCRIBE_SIGNING_SECRET`. Use `https://woxza.io` for `CORS_ORIGINS`.

4. Build and start the production stack:

   ```bash
   docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build
   docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml ps
   curl http://127.0.0.1:8787/health
   ```

To deploy an update, pull the new code and run `docker compose up -d --build` again. The named database volume is preserved.

## Backups

Create a SQL backup from the running PostgreSQL container:

```bash
docker compose exec -T db pg_dump -U voxa -d voxa > voxa-backup.sql
```

For production, Caddy provides HTTPS in front of the loopback-only web container. PostgreSQL is reachable only by the API on the private Docker network; schedule encrypted database backups to OCI Object Storage.
