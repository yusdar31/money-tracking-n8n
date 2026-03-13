const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/budget
 * Query params:
 *   - tahun: YYYY (default: tahun ini)
 *   - bulan: YYYY-MM (get single month)
 */
router.get('/', async (req, res, next) => {
    try {
        const { tahun, bulan } = req.query;

        let query, params;

        if (bulan) {
            query = `
        SELECT * FROM v_budget_dashboard
        WHERE bulan = DATE_TRUNC('month', $1::DATE)::DATE
      `;
            params = [`${bulan}-01`];
        } else {
            const year = tahun || new Date().getFullYear();
            query = `
        SELECT * FROM v_budget_dashboard
        WHERE EXTRACT(YEAR FROM bulan) = $1
        ORDER BY bulan DESC
      `;
            params = [year];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/budget/:bulan/target-saving
 * Body: { target_saving: number }
 * Update target saving for a specific month
 */
router.patch('/:bulan/target-saving', async (req, res, next) => {
    try {
        const { bulan } = req.params;
        const { target_saving } = req.body;

        if (!target_saving || isNaN(target_saving) || Number(target_saving) <= 0) {
            return res.status(400).json({ error: 'target_saving harus berupa angka positif' });
        }

        const result = await pool.query(
            `UPDATE monthly_budget 
       SET target_saving = $1, updated_at = NOW()
       WHERE bulan = DATE_TRUNC('month', $2::DATE)::DATE
       RETURNING *`,
            [Number(target_saving), `${bulan}-01`]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Budget bulan tidak ditemukan' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
