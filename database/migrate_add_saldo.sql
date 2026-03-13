-- ================================================================
-- MIGRATION: Add Balance (Saldo) Tracking
-- Run once to add saldo tracking to the expense tracker system
-- ================================================================

-- 1. Widen the tipe CHECK constraint to include 'transfer_pocket'
ALTER TABLE jago_transactions
  DROP CONSTRAINT IF EXISTS jago_transactions_tipe_check;

ALTER TABLE jago_transactions
  ADD CONSTRAINT jago_transactions_tipe_check
    CHECK (tipe IN ('debit', 'kredit', 'transfer_pocket'));

-- 2. Add saldo_akhir column to jago_transactions
ALTER TABLE jago_transactions
  ADD COLUMN IF NOT EXISTS saldo_akhir NUMERIC(15, 2);

-- 3. Create saldo_rekening config table to track running balance
CREATE TABLE IF NOT EXISTS saldo_rekening (
    id              SERIAL PRIMARY KEY,
    saldo_sekarang  NUMERIC(15, 2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    keterangan      TEXT
);

-- 4. Insert initial balance (Rp 3.723.000)
INSERT INTO saldo_rekening (saldo_sekarang, keterangan)
VALUES (3723000, 'Saldo awal input manual - 26 Feb 2026')
ON CONFLICT DO NOTHING;

-- 5. View: v_saldo_dashboard (useful for Looker Studio)
CREATE OR REPLACE VIEW v_saldo_dashboard AS
SELECT
    t.tanggal_waktu,
    t.tipe,
    t.nominal,
    t.merchant_deskripsi,
    t.kategori_otomatis,
    t.saldo_akhir,
    t.email_subject
FROM jago_transactions t
ORDER BY t.tanggal_waktu DESC;
