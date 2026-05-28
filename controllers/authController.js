const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, username, password_hash, locked_until, login_attempts FROM admins WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      await new Promise(r => setTimeout(r, 800));
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const admin = rows[0];

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.status(429).json({ error: 'Conta temporariamente bloqueada. Tente mais tarde.' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      const attempts = (admin.login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db.query(
        'UPDATE admins SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockUntil, admin.id]
      );
      await new Promise(r => setTimeout(r, 800));
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    await db.query(
      'UPDATE admins SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({ token });
  } catch {
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = { login };
