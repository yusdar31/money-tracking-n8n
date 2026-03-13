const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/summary
 * Dashboard summary: saldo terkini + budget bulan ini + statistik transaksi
 */
router.get('/', async (req, res, next) => {
    try {
        const [saldoResult, budgetResult, statsResult, recentResult] = await Promise.all([
            // Saldo terkini
            pool.query(`
        SELECT saldo_sekarang, updated_at 
        FROM saldo_rekening 
        ORDER BY updated_at DESC LIMIT 1
      `),
            // Budget bulan ini
            pool.query(`
        SELECT * FROM v_budget_dashboard 
        WHERE bulan = DATE_TRUNC('month', NOW())::DATE
        LIMIT 1
      `),
            // Statistik transaksi bulan ini
            pool.query(`
        SELECT
          COUNT(*) AS total_transaksi,
          COUNT(*) FILTER (WHERE tipe = 'debit') AS total_transaksi_debit,
          COUNT(*) FILTER (WHERE tipe = 'kredit') AS total_transaksi_kredit,
          COALESCE(SUM(nominal) FILTER (WHERE tipe = 'debit'), 0) AS total_debit,
          COALESCE(SUM(nominal) FILTER (WHERE tipe = 'kredit'), 0) AS total_kredit
        FROM jago_transactions
        WHERE tanggal_waktu >= DATE_TRUNC('month', NOW())
          AND tanggal_waktu < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
      `),
            // 5 transaksi terbaru
            pool.query(`
        SELECT id, tanggal_waktu, tipe, nominal, merchant_deskripsi, kategori_otomatis
        FROM jago_transactions
        ORDER BY tanggal_waktu DESC
        LIMIT 5
      `),
        ]);

        res.json({
            saldo: saldoResult.rows[0] || { saldo_sekarang: 0, updated_at: null },
            budget_bulan_ini: budgetResult.rows[0] || null,
            statistik_bulan_ini: statsResult.rows[0],
            transaksi_terbaru: recentResult.rows,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/summary/trend
 * Monthly trend: 6 bulan terakhir
 */
router.get('/trend', async (req, res, next) => {
    try {
        const result = await pool.query(`
      SELECT 
        bulan,
        bulan_label,
        total_pemasukan,
        total_pengeluaran,
        sisa_budget,
        target_saving,
        pct_saving_risk,
        status_budget,
        jumlah_transaksi
      FROM v_budget_dashboard
      ORDER BY bulan DESC
      LIMIT 6
    `);
        res.json(result.rows.reverse()); // asc untuk chart
    } catch (err) {
        next(err);
    }
});

module.exports = router;
