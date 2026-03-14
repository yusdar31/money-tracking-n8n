const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/transactions
 * Query params:
 *   - bulan: YYYY-MM (default: bulan ini)
 *   - tipe: debit | kredit
 *   - kategori: string
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 */
router.get('/', async (req, res, next) => {
    try {
        const { bulan, tipe, kategori, limit = 50, offset = 0 } = req.query;

        // Determine date range
        let startDate, endDate;
        if (bulan) {
            startDate = `${bulan}-01`;
            const [year, month] = bulan.split('-').map(Number);
            const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
            endDate = `${nextMonth}-01`;
        } else {
            startDate = "DATE_TRUNC('month', NOW())";
            endDate = "DATE_TRUNC('month', NOW()) + INTERVAL '1 month'";
        }

        const conditions = [];
        const params = [];
        let paramIdx = 1;

        if (bulan) {
            conditions.push(`tanggal_waktu >= $${paramIdx++} AND tanggal_waktu < $${paramIdx++}`);
            params.push(startDate, endDate);
        } else {
            conditions.push(`tanggal_waktu >= DATE_TRUNC('month', NOW()) AND tanggal_waktu < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`);
        }

        if (tipe) {
            conditions.push(`tipe = $${paramIdx++}`);
            params.push(tipe);
        }

        if (kategori) {
            conditions.push(`kategori_otomatis = $${paramIdx++}`);
            params.push(kategori);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM jago_transactions ${whereClause}`,
            params
        );

        params.push(parseInt(limit), parseInt(offset));
        const dataResult = await pool.query(
            `SELECT 
        id,
        tanggal_waktu,
        tipe,
        nominal,
        merchant_deskripsi,
        kategori_otomatis,
        email_subject,
        created_at
      FROM jago_transactions 
      ${whereClause}
      ORDER BY tanggal_waktu DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            params
        );

        res.json({
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
            limit: parseInt(limit),
            offset: parseInt(offset),
            data: dataResult.rows,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/transactions/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM jago_transactions WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/transactions/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM jago_transactions WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
