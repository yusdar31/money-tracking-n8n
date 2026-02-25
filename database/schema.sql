-- ================================================================
-- EXPENSE TRACKER - PostgreSQL Schema
-- Target DB: expense_tracker
-- Run as: n8n_user (or superuser for initial setup)
-- ================================================================

-- Use a dedicated schema for app data
CREATE SCHEMA IF NOT EXISTS public;

-- ================================================================
-- EXTENSION
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE: jago_transactions
-- ================================================================
CREATE TABLE IF NOT EXISTS jago_transactions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal_waktu       TIMESTAMPTZ NOT NULL,
    tipe                VARCHAR(10) NOT NULL CHECK (tipe IN ('debit', 'kredit')),
    nominal             NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
    merchant_deskripsi  TEXT,
    kategori_otomatis   VARCHAR(100),
    email_subject       TEXT,           -- raw email subject for audit
    raw_email_body      TEXT,           -- raw snippet for debugging
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jago_tx_date
    ON jago_transactions (tanggal_waktu DESC);

CREATE INDEX IF NOT EXISTS idx_jago_tx_tipe
    ON jago_transactions (tipe);

CREATE INDEX IF NOT EXISTS idx_jago_tx_month
    ON jago_transactions (DATE_TRUNC('month', tanggal_waktu));

-- ================================================================
-- TABLE: monthly_budget
-- ================================================================
CREATE TABLE IF NOT EXISTS monthly_budget (
    id                  SERIAL      PRIMARY KEY,
    bulan               DATE        NOT NULL UNIQUE,  -- e.g. '2025-02-01'
    target_saving       NUMERIC(15, 2) NOT NULL DEFAULT 3000000,
    total_pengeluaran   NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_pemasukan     NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sisa_budget         NUMERIC(15, 2) GENERATED ALWAYS AS
                            (total_pemasukan - total_pengeluaran - target_saving)
                        STORED,
    pct_saving_risk     NUMERIC(5, 2)  GENERATED ALWAYS AS (
                            CASE
                                WHEN total_pemasukan = 0 THEN 0
                                ELSE ROUND(
                                    (total_pengeluaran / (total_pemasukan - target_saving)) * 100,
                                    2
                                )
                            END
                        ) STORED,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN monthly_budget.sisa_budget IS
    'Pemasukan - Pengeluaran - Target Saving. Negatif = target saving terancam.';
COMMENT ON COLUMN monthly_budget.pct_saving_risk IS
    'Persentase pengeluaran terhadap dana yang boleh dibelanjakan. >100% = bahaya.';

-- ================================================================
-- FUNCTION: upsert_monthly_budget()
-- Auto-called by trigger on jago_transactions INSERT / DELETE / UPDATE
-- ================================================================
CREATE OR REPLACE FUNCTION upsert_monthly_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_bulan DATE;
BEGIN
    -- Determine which month to update
    IF TG_OP = 'DELETE' THEN
        v_bulan := DATE_TRUNC('month', OLD.tanggal_waktu)::DATE;
    ELSE
        v_bulan := DATE_TRUNC('month', NEW.tanggal_waktu)::DATE;
    END IF;

    -- Upsert the monthly_budget row by re-aggregating from transactions
    INSERT INTO monthly_budget (
        bulan,
        total_pengeluaran,
        total_pemasukan
    )
    SELECT
        DATE_TRUNC('month', tanggal_waktu)::DATE AS bulan,
        COALESCE(SUM(nominal) FILTER (WHERE tipe = 'debit'),  0) AS total_pengeluaran,
        COALESCE(SUM(nominal) FILTER (WHERE tipe = 'kredit'), 0) AS total_pemasukan
    FROM jago_transactions
    WHERE DATE_TRUNC('month', tanggal_waktu) = v_bulan
    GROUP BY DATE_TRUNC('month', tanggal_waktu)
    ON CONFLICT (bulan)
    DO UPDATE SET
        total_pengeluaran = EXCLUDED.total_pengeluaran,
        total_pemasukan   = EXCLUDED.total_pemasukan,
        updated_at        = NOW();

    -- Handle edge case: all transactions in month deleted
    IF TG_OP = 'DELETE' AND NOT EXISTS (
        SELECT 1 FROM jago_transactions
        WHERE DATE_TRUNC('month', tanggal_waktu) = v_bulan
    ) THEN
        UPDATE monthly_budget
        SET total_pengeluaran = 0,
            total_pemasukan   = 0,
            updated_at        = NOW()
        WHERE bulan = v_bulan;
    END IF;

    RETURN NULL; -- AFTER trigger
END;
$$;

-- ================================================================
-- TRIGGER: auto-update monthly_budget
-- ================================================================
DROP TRIGGER IF EXISTS trg_update_monthly_budget ON jago_transactions;

CREATE TRIGGER trg_update_monthly_budget
AFTER INSERT OR UPDATE OR DELETE
ON jago_transactions
FOR EACH ROW
EXECUTE FUNCTION upsert_monthly_budget();

-- ================================================================
-- VIEW: v_budget_dashboard
-- Useful for Looker Studio direct query
-- ================================================================
CREATE OR REPLACE VIEW v_budget_dashboard AS
SELECT
    mb.bulan,
    TO_CHAR(mb.bulan, 'Month YYYY')            AS bulan_label,
    mb.target_saving,
    mb.total_pemasukan,
    mb.total_pengeluaran,
    mb.sisa_budget,
    mb.pct_saving_risk,
    CASE
        WHEN mb.pct_saving_risk >= 100 THEN 'DANGER'
        WHEN mb.pct_saving_risk >= 80  THEN 'WARNING'
        ELSE 'SAFE'
    END                                         AS status_budget,
    (
        SELECT COUNT(*)
        FROM jago_transactions jt
        WHERE DATE_TRUNC('month', jt.tanggal_waktu) = mb.bulan
    )                                           AS jumlah_transaksi
FROM monthly_budget mb
ORDER BY mb.bulan DESC;

-- ================================================================
-- SAMPLE: Initial budget rows (optional, removes need to wait for 1st tx)
-- ================================================================
INSERT INTO monthly_budget (bulan, target_saving)
VALUES
    (DATE_TRUNC('month', CURRENT_DATE)::DATE, 3000000),
    (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 3000000)
ON CONFLICT (bulan) DO NOTHING;

-- ================================================================
-- GRANT PRIVILEGES (run after n8n_user is created)
-- ================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO n8n_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n8n_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO n8n_user;
