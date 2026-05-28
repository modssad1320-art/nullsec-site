const router = require('express').Router();
const { body } = require('express-validator');
const { login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login',
  loginLimiter,
  [
    body('username').trim().isLength({ min: 1, max: 50 }).escape(),
    body('password').isLength({ min: 1, max: 100 }),
  ],
  login
);

module.exports = router;
