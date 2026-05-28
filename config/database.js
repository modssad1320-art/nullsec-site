require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(c => { c.release(); console.log('[DB] Conexão estabelecida.'); })
  .catch(err => { console.error('[DB] Erro na conexão:', err.message); process.exit(1); });

module.exports = pool;
