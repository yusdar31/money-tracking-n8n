#!/bin/bash
###############################################################
# EC2 User Data Script - n8n Auto-Setup
# Rendered by Terraform templatefile()
# Variables injected: db_host, db_name, db_user, db_password,
#                     n8n_domain
###############################################################
set -euo pipefail
exec > /var/log/user_data.log 2>&1

echo "=== [1/6] System Update ==="
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw

echo "=== [2/6] Install Docker ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "=== [3/6] Install Caddy (reverse proxy + auto HTTPS) ==="
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y
apt-get install -y caddy

echo "=== [4/6] Create application directory ==="
mkdir -p /opt/n8n/data
chown -R 1000:1000 /opt/n8n/data

echo "=== [5/6] Write docker-compose.yml ==="
cat > /opt/n8n/docker-compose.yml << 'COMPOSE_EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Basic auth
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: "admin"
      N8N_BASIC_AUTH_PASSWORD: "CHANGE_ME_n8n_password"

      # Webhook / domain
      WEBHOOK_URL: "https://${n8n_domain}"
      N8N_HOST: "${n8n_domain}"
      N8N_PORT: "5678"
      N8N_PROTOCOL: "https"

      # Timezone (WIB)
      GENERIC_TIMEZONE: "Asia/Jakarta"
      TZ: "Asia/Jakarta"

      # DB backend — n8n stores its own workflow data in PostgreSQL too
      DB_TYPE: "postgresdb"
      DB_POSTGRESDB_HOST: "${db_host}"
      DB_POSTGRESDB_PORT: "5432"
      DB_POSTGRESDB_DATABASE: "${db_name}"
      DB_POSTGRESDB_USER: "${db_user}"
      DB_POSTGRESDB_PASSWORD: "${db_password}"
      DB_POSTGRESDB_SCHEMA: "n8n"

      # Encryption key for credentials (generate once with: openssl rand -hex 24)
      N8N_ENCRYPTION_KEY: "CHANGE_ME_generate_with_openssl_rand_hex_24"

      # Executions
      EXECUTIONS_DATA_SAVE_ON_ERROR: "all"
      EXECUTIONS_DATA_SAVE_ON_SUCCESS: "all"
      EXECUTIONS_DATA_MAX_AGE: "336"  # 14 days

    volumes:
      - /opt/n8n/data:/home/node/.n8n

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

COMPOSE_EOF

echo "=== [5b/6] Write Caddyfile ==="
cat > /etc/caddy/Caddyfile << CADDY_EOF
${n8n_domain} {
    reverse_proxy localhost:5678

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file /var/log/caddy/n8n_access.log {
            roll_size 10mb
            roll_keep 5
        }
    }
}
CADDY_EOF

mkdir -p /var/log/caddy
systemctl reload caddy || systemctl restart caddy

echo "=== [6/6] Start n8n ==="
cd /opt/n8n
docker compose up -d

echo "=== Setup Complete ==="
echo "n8n is running at https://${n8n_domain}"
echo "Check logs: docker compose -f /opt/n8n/docker-compose.yml logs -f"
