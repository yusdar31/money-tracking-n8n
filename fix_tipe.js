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
    const before = await client.query("SELECT tipe, COUNT(*) as jml FROM jago_transactions GROUP BY tipe");
    console.log('=== SEBELUM FIX ===');
    before.rows.forEach(r => console.log('  ' + r.tipe + ': ' + r.jml + ' transaksi'));

    const toFix = await client.query(
      "SELECT id, email_subject FROM jago_transactions WHERE tipe = 'kredit' AND (email_subject ILIKE '%membayar%' OR email_subject ILIKE '%top up e-wallet%' OR email_subject ILIKE '%tarik tunai%' OR email_subject ILIKE '%pembayaran%')"
    );
    console.log('\n=== AKAN DIUBAH KE DEBIT (' + toFix.rows.length + ' baris) ===');
    toFix.rows.forEach(r => console.log('  [' + r.id.slice(0,8) + '] ' + r.email_subject));

    const updated = await client.query(
      "UPDATE jago_transactions SET tipe = 'debit' WHERE tipe = 'kredit' AND (email_subject ILIKE '%membayar%' OR email_subject ILIKE '%top up e-wallet%' OR email_subject ILIKE '%tarik tunai%' OR email_subject ILIKE '%pembayaran%') RETURNING id"
    );
    console.log('\n=== UPDATE SELESAI: ' + updated.rowCount + ' transaksi diubah ke DEBIT ===');

    const after = await client.query("SELECT tipe, COUNT(*) as jml FROM jago_transactions GROUP BY tipe");
    console.log('\n=== SETELAH FIX ===');
    after.rows.forEach(r => console.log('  ' + r.tipe + ': ' + r.jml + ' transaksi'));

    const remaining = await client.query("SELECT email_subject FROM jago_transactions WHERE tipe='kredit' LIMIT 20");
    console.log('\n=== SISA KREDIT ===');
    remaining.rows.forEach(r => console.log('  ' + r.email_subject));

  } finally {
    client.release();
    await pool.end();
  }
}

fixTipe().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
