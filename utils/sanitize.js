const xss = require('xss');

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

function sanitizeStr(value) {
  if (typeof value !== 'string') return '';
  return xss(value.trim(), xssOptions);
}

function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  const clean = value.trim();
  if (!/^https?:\/\//i.test(clean)) return '';
  return xss(clean, xssOptions);
}

function sanitizePrice(value) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

module.exports = { sanitizeStr, sanitizeUrl, sanitizePrice };
