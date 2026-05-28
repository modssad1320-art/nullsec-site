require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  multipleStatements: false,
});

pool.getConnection()
  .then(conn => { conn.release(); console.log('[DB] Conexão estabelecida.'); })
  .catch(err => { console.error('[DB] Erro na conexão:', err.message); process.exit(1); });

module.exports = pool;
