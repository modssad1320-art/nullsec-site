require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  console.log('[SETUP] Criando tabelas...');
  const sql = fs.readFileSync(path.join(__dirname, '../setup.sql'), 'utf8');
  await pool.query(sql);
  console.log('[SETUP] Tabelas criadas.');

  const { rows } = await pool.query('SELECT id FROM admins WHERE username = $1', ['citan00l']);
  if (rows.length === 0) {
    const hash = await bcrypt.hash('citan00l', 12);
    await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['citan00l', hash]);
    console.log('[SETUP] Admin criado: citan00l');
  } else {
    console.log('[SETUP] Admin já existe.');
  }

  await pool.end();
  console.log('[SETUP] Concluído.');
}

setup().catch(err => { console.error('[SETUP] Erro:', err.message); process.exit(1); });
