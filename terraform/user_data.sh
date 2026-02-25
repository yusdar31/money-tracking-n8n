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

echo "=== [6/7] Run DB Migrations ==="
mkdir -p /opt/n8n/db_migrations
cat > /opt/n8n/db_migrations/schema.sql << 'SQL_SCHEMA_EOF'
-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS jago_transactions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal_waktu       TIMESTAMPTZ NOT NULL,
    tipe                VARCHAR(10) NOT NULL CHECK (tipe IN ('debit', 'kredit')),
    nominal             NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
    merchant_deskripsi  TEXT,
    kategori_otomatis   VARCHAR(100),
    email_subject       VARCHAR(255),
    raw_body            TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent exact duplicate transactions
    CONSTRAINT unique_transaction UNIQUE (tanggal_waktu, nominal, merchant_deskripsi)
);

-- Index for searching descriptions and dates
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON jago_transactions(merchant_deskripsi);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON jago_transactions(tanggal_waktu);

-- 2. Create MONTHLY BUDGET Table
CREATE TABLE IF NOT EXISTS monthly_budget (
    id                  SERIAL      PRIMARY KEY,
    bulan               DATE        NOT NULL UNIQUE, -- Store as 'YYYY-MM-01'
    target_saving       NUMERIC(15, 2) NOT NULL DEFAULT 3000000,
    total_pengeluaran   NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_pemasukan     NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sisa_budget         NUMERIC(15, 2) GENERATED ALWAYS AS (total_pemasukan - total_pengeluaran - target_saving) STORED,
    
    pct_saving_risk     NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_pemasukan = 0 THEN 0 
            ELSE (total_pengeluaran / (total_pemasukan - target_saving)) * 100 
        END
    ) STORED,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index on the month for fast aggregation lookups
CREATE INDEX IF NOT EXISTS idx_budget_bulan ON monthly_budget(bulan);

-- 3. Auto update 'updated_at' functions
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_jago_transactions ON jago_transactions;
CREATE TRIGGER trg_update_jago_transactions
    BEFORE UPDATE ON jago_transactions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trg_update_monthly_budget ON monthly_budget;
CREATE TRIGGER trg_update_monthly_budget
    BEFORE UPDATE ON monthly_budget
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 4. Main Aggregation Trigger for Budget tracking
CREATE OR REPLACE FUNCTION upsert_monthly_budget()
RETURNS TRIGGER AS $$
DECLARE
    r_bulan DATE;
    r_pengeluaran NUMERIC(15, 2) := 0;
    r_pemasukan NUMERIC(15, 2) := 0;
BEGIN
    -- Determine which month is affected
    IF TG_OP = 'DELETE' THEN
        r_bulan := DATE_TRUNC('month', OLD.tanggal_waktu)::DATE;
    ELSE
        r_bulan := DATE_TRUNC('month', NEW.tanggal_waktu)::DATE;
    END IF;

    -- Calculate total pengeluaran (debit) and pemasukan (kredit) for that month
    SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'debit' THEN nominal ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipe = 'kredit' THEN nominal ELSE 0 END), 0)
    INTO 
        r_pengeluaran, 
        r_pemasukan
    FROM jago_transactions
    WHERE DATE_TRUNC('month', tanggal_waktu)::DATE = r_bulan;

    -- Upsert the calculated totals into monthly_budget
    INSERT INTO monthly_budget (bulan, total_pengeluaran, total_pemasukan)
    VALUES (r_bulan, r_pengeluaran, r_pemasukan)
    ON CONFLICT (bulan) 
    DO UPDATE SET 
        total_pengeluaran = r_pengeluaran,
        total_pemasukan = r_pemasukan,
        updated_at = NOW();

    RETURN NULL; -- Because it's an AFTER trigger
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_monthly_budget ON jago_transactions;
CREATE TRIGGER trg_update_monthly_budget
    AFTER INSERT OR UPDATE OR DELETE ON jago_transactions
    FOR EACH ROW EXECUTE FUNCTION upsert_monthly_budget();

-- 5. Helper View for Looker Studio Dashboard
CREATE OR REPLACE VIEW v_budget_dashboard AS
SELECT 
    bulan,
    target_saving,
    total_pengeluaran,
    total_pemasukan,
    sisa_budget,
    pct_saving_risk,
    CASE 
        WHEN pct_saving_risk >= 100 THEN 'DANGER - Target Failed'
        WHEN pct_saving_risk >= 80 THEN 'WARNING - Nearing Limit'
        ELSE 'SAFE'
    END AS budget_status,
    updated_at
FROM monthly_budget
ORDER BY bulan DESC;
SQL_SCHEMA_EOF

# Run Docker container to execute migrations
docker run --rm \
  -v /opt/n8n/db_migrations/schema.sql:/app/schema.sql \
  -e PGPASSWORD="${db_password}" \
  postgres:15-alpine \
  psql -h "${db_host}" -p 5432 -U "${db_user}" -d "${db_name}" -f /app/schema.sql

echo "=== [7/7] Start n8n ==="
cd /opt/n8n
docker compose up -d

echo "=== Setup Complete ==="
echo "n8n is running at https://${n8n_domain}"
echo "Check logs: docker compose -f /opt/n8n/docker-compose.yml logs -f"
