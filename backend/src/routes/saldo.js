const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/saldo
 * Returns current balance from saldo_rekening table
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT saldo_sekarang, updated_at, keterangan 
       FROM saldo_rekening 
       ORDER BY updated_at DESC 
       LIMIT 1`
        );

        if (result.rows.length === 0) {
            return res.json({ saldo_sekarang: 0, updated_at: null, keterangan: 'Belum ada data' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/saldo/history
 * Returns saldo history (if tracked)
 */
router.get('/history', async (req, res, next) => {
    try {
        const { limit = 30 } = req.query;
        const result = await pool.query(
            `SELECT saldo_sekarang, updated_at, keterangan 
       FROM saldo_rekening 
       ORDER BY updated_at DESC 
       LIMIT $1`,
            [parseInt(limit)]
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
