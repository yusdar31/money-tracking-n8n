const pool = require('./src/db');
async function test() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM jago_transactions WHERE tanggal_waktu >= $1 AND tanggal_waktu < $2', ['2026-02-01', '2026-03-01']);
        console.log('Count Feb:', res.rows[0].count);
        const res2 = await pool.query('SELECT COUNT(*) FROM jago_transactions WHERE tanggal_waktu >= $1 AND tanggal_waktu < $2', ['2026-03-01', '2026-04-01']);
        console.log('Count Mar:', res2.rows[0].count);
    } catch(err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
test();
