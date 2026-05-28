const db = require('../config/database');
const { sanitizeStr, sanitizeUrl, sanitizePrice } = require('../utils/sanitize');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

async function getCourses(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, cover_image, old_price, promo_price, checkout_link, display_order FROM courses WHERE active = 1 ORDER BY display_order ASC, id ASC'
    );
    return res.json({ courses: rows });
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar cursos.' });
  }
}

async function getAllCourses(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM courses ORDER BY display_order ASC, id ASC'
    );
    return res.json({ courses: rows });
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar cursos.' });
  }
}

async function createCourse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const name = sanitizeStr(req.body.name);
  const description = sanitizeStr(req.body.description || '');
  const checkoutLink = sanitizeUrl(req.body.checkout_link);
  const oldPrice = req.body.old_price ? sanitizePrice(req.body.old_price) : null;
  const promoPrice = sanitizePrice(req.body.promo_price);
  const displayOrder = parseInt(req.body.display_order) || 0;
  const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

  if (!checkoutLink) return res.status(400).json({ error: 'Link de checkout inválido.' });
  if (promoPrice === null) return res.status(400).json({ error: 'Preço promocional inválido.' });

  try {
    const [result] = await db.query(
      'INSERT INTO courses (name, description, cover_image, old_price, promo_price, checkout_link, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, coverImage, oldPrice, promoPrice, checkoutLink, displayOrder]
    );
    return res.status(201).json({ id: result.insertId, message: 'Curso criado.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao criar curso.' });
  }
}

async function updateCourse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido.' });

  const name = sanitizeStr(req.body.name);
  const description = sanitizeStr(req.body.description || '');
  const checkoutLink = sanitizeUrl(req.body.checkout_link);
  const oldPrice = req.body.old_price ? sanitizePrice(req.body.old_price) : null;
  const promoPrice = sanitizePrice(req.body.promo_price);
  const displayOrder = parseInt(req.body.display_order) || 0;
  const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : 1;

  if (!checkoutLink) return res.status(400).json({ error: 'Link de checkout inválido.' });
  if (promoPrice === null) return res.status(400).json({ error: 'Preço promocional inválido.' });

  try {
    const [existing] = await db.query('SELECT cover_image FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Curso não encontrado.' });

    let coverImage = existing[0].cover_image;

    if (req.file) {
      if (coverImage) {
        const oldPath = path.join(__dirname, '../public', coverImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      coverImage = `/uploads/${req.file.filename}`;
    }

    await db.query(
      'UPDATE courses SET name=?, description=?, cover_image=?, old_price=?, promo_price=?, checkout_link=?, display_order=?, active=?, updated_at=NOW() WHERE id=?',
      [name, description, coverImage, oldPrice, promoPrice, checkoutLink, displayOrder, active, id]
    );

    return res.json({ message: 'Curso atualizado.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar curso.' });
  }
}

async function deleteCourse(req, res) {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido.' });

  try {
    const [existing] = await db.query('SELECT cover_image FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Curso não encontrado.' });

    const coverImage = existing[0].cover_image;
    if (coverImage) {
      const imgPath = path.join(__dirname, '../public', coverImage);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await db.query('DELETE FROM courses WHERE id = ?', [id]);
    return res.json({ message: 'Curso removido.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao remover curso.' });
  }
}

async function getConfig(req, res) {
  try {
    const [rows] = await db.query('SELECT config_key, config_value FROM site_config');
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    return res.json({ config });
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
}

async function updateConfig(req, res) {
  const { key, value } = req.body;
  const allowed = ['whatsapp_link', 'hero_title', 'hero_subtitle'];

  if (!allowed.includes(key)) return res.status(400).json({ error: 'Chave inválida.' });

  const clean = key === 'whatsapp_link' ? sanitizeUrl(value) : sanitizeStr(value);
  if (!clean) return res.status(400).json({ error: 'Valor inválido.' });

  try {
    await db.query(
      'INSERT INTO site_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()',
      [key, clean, clean]
    );
    return res.json({ message: 'Configuração atualizada.' });
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar configuração.' });
  }
}

module.exports = { getCourses, getAllCourses, createCourse, updateCourse, deleteCourse, getConfig, updateConfig };
