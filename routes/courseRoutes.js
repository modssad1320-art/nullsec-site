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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido.'));
    }
  },
});

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
router.post('/admin/courses', uploadLimiter, upload.single('cover_image'), courseValidation, createCourse);
router.put('/admin/courses/:id', uploadLimiter, upload.single('cover_image'), courseValidation, updateCourse);
router.delete('/admin/courses/:id', deleteCourse);
router.put('/admin/config', [
  body('key').isIn(['whatsapp_link', 'hero_title', 'hero_subtitle']),
  body('value').trim().isLength({ min: 1, max: 500 }),
], updateConfig);

module.exports = router;
