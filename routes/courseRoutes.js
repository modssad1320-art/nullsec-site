const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  getCourses, getAllCourses, createCourse, updateCourse, deleteCourse, getConfig, updateConfig
} = require('../controllers/courseController');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Magic bytes signatures for each allowed type
const MAGIC = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif':  [0x47, 0x49, 0x46],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    // Force safe extension from MIME type, ignore client filename
    const mimeToExt = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    const ext = mimeToExt[file.mimetype] || '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function verifyMagicBytes(buffer, mimetype) {
  const sig = MAGIC[mimetype];
  if (!sig) return false;
  return sig.every((byte, i) => buffer[i] === byte);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_TYPES.includes(file.mimetype) || !ALLOWED_EXTS.includes(ext)) {
      return cb(new Error('Tipo de arquivo não permitido.'));
    }
    cb(null, true);
  },
});

// Post-upload magic bytes verification middleware
function verifyUpload(req, res, next) {
  if (!req.file) return next();
  const fs = require('fs');
  const buf = Buffer.alloc(8);
  let fd;
  try {
    fd = fs.openSync(req.file.path, 'r');
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
  } catch {
    if (fd) try { fs.closeSync(fd); } catch {}
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Erro ao verificar arquivo.' });
  }
  if (!verifyMagicBytes(buf, req.file.mimetype)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Conteúdo do arquivo não corresponde ao tipo declarado.' });
  }
  next();
}

const courseValidation = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Nome obrigatório (max 255).'),
  body('description').optional().isLength({ max: 2000 }),
  body('promo_price').isFloat({ min: 0 }).withMessage('Preço inválido.'),
  body('checkout_link').trim().isURL({ protocols: ['http', 'https'] }).withMessage('Link inválido.'),
];

router.get('/public/courses', getCourses);
router.get('/public/config', getConfig);

router.use(verifyToken);

router.get('/admin/courses', getAllCourses);
router.post('/admin/courses', uploadLimiter, upload.single('cover_image'), verifyUpload, courseValidation, createCourse);
router.put('/admin/courses/:id', uploadLimiter, upload.single('cover_image'), verifyUpload, courseValidation, updateCourse);
router.delete('/admin/courses/:id', deleteCourse);
router.put('/admin/config', [
  body('key').isIn(['whatsapp_link', 'hero_title', 'hero_subtitle']),
  body('value').trim().isLength({ min: 1, max: 500 }),
], updateConfig);

module.exports = router;
