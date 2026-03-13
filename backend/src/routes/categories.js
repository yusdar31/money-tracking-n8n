const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/categories
 * Breakdown pengeluaran per kategori
 * Query params:
 *   - bulan: YYYY-MM (default: bulan ini)
 *   - tipe: debit | kredit (default: debit)
 */
router.get('/', async (req, res, next) => {
    try {
        const { bulan, tipe = 'debit' } = req.query;

        let dateCondition, params;

        if (bulan) {
            dateCondition = `tanggal_waktu >= $1 AND tanggal_waktu < $2`;
            const [year, month] = bulan.split('-').map(Number);
            const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
            params = [`${bulan}-01`, `${nextMonth}-01`, tipe];
        } else {
            dateCondition = `tanggal_waktu >= DATE_TRUNC('month', NOW()) AND tanggal_waktu < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`;
            params = [tipe];
        }

        const tipeIdx = params.indexOf(tipe) + 1;

        const result = await pool.query(
            `SELECT
        COALESCE(kategori_otomatis, 'Tidak Terkategori') AS kategori,
        COUNT(*) AS jumlah_transaksi,
        SUM(nominal) AS total_nominal,
        ROUND(SUM(nominal) * 100.0 / NULLIF(SUM(SUM(nominal)) OVER(), 0), 2) AS pct
      FROM jago_transactions
      WHERE ${dateCondition}
        AND tipe = $${tipeIdx}
      GROUP BY kategori_otomatis
      ORDER BY total_nominal DESC`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/categories/list
 * Get all unique categories
 */
router.get('/list', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT COALESCE(kategori_otomatis, 'Tidak Terkategori') AS kategori
       FROM jago_transactions
       ORDER BY kategori`
        );
        res.json(result.rows.map(r => r.kategori));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
