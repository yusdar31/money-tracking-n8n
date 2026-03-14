const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '18.143.120.150',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'expense_tracker',
  user: process.env.DB_USER || 'n8n_user',
  password: process.env.DB_PASSWORD || 'ExpenseTrackerPassword2026',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT email_subject, tipe, nominal, tanggal_waktu FROM jago_transactions WHERE tipe = 'kredit' ORDER BY tanggal_waktu DESC");
    console.log('=== DATA KREDIT TERSISA (' + res.rows.length + ') ===');
    res.rows.forEach(r => console.log('  [' + r.tanggal_waktu.toISOString().slice(0,10) + '] ' + r.email_subject + ' | ' + r.nominal));
    
    const stats = await client.query("SELECT tipe, COUNT(*) FROM jago_transactions GROUP BY tipe");
    console.log('\n=== STATISTIK KESELURUHAN ===');
    stats.rows.forEach(r => console.log('  ' + r.tipe + ': ' + r.count));
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(e => { console.error(e.message); process.exit(1); });
