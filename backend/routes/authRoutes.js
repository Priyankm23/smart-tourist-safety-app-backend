const express = require('express');
const {
  registerTourist,
  login,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register/tourist', registerTourist);
router.post('/login', login);

module.exports = router;