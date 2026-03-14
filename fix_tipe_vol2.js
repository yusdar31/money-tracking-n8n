const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '18.143.120.150',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'expense_tracker',
  user: process.env.DB_USER || 'n8n_user',
  password: process.env.DB_PASSWORD || 'ExpenseTrackerPassword2026',
  ssl: { rejectUnauthorized: false }
});

async function fixTipe() {
  const client = await pool.connect();
  try {
    const updated = await client.query(
      "UPDATE jago_transactions SET tipe = 'debit' WHERE tipe = 'kredit' AND (email_subject ILIKE '%melakukan transfer%' OR email_subject ILIKE '%melakukan transaksi%') RETURNING id"
    );
    console.log('\n=== UPDATE SELESAI: ' + updated.rowCount + ' transaksi tambahan diubah ke DEBIT ===');

    const after = await client.query("SELECT tipe, COUNT(*) as jml FROM jago_transactions GROUP BY tipe");
    console.log('\n=== STATISTIK AKHIR ===');
    after.rows.forEach(r => console.log('  ' + r.tipe + ': ' + r.jml + ' transaksi'));

  } finally {
    client.release();
    await pool.end();
  }
}

fixTipe().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
