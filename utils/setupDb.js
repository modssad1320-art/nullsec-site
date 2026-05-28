require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: true,
  });

  console.log('[SETUP] Criando banco de dados e tabelas...');
  const sql = fs.readFileSync(path.join(__dirname, '../setup.sql'), 'utf8');
  await conn.query(sql);
  console.log('[SETUP] Tabelas criadas.');

  await conn.query('USE nullsec_db');

  const [rows] = await conn.query('SELECT id FROM admins WHERE username = ?', ['citan00l']);
  if (rows.length === 0) {
    const hash = await bcrypt.hash('citan00l', 12);
    await conn.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['citan00l', hash]);
    console.log('[SETUP] Admin criado: citan00l');
  } else {
    console.log('[SETUP] Admin já existe.');
  }

  await conn.end();
  console.log('[SETUP] Concluído com sucesso.');
}

setup().catch(err => { console.error('[SETUP] Erro:', err.message); process.exit(1); });
