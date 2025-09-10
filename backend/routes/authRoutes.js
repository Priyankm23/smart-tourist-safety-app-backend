const express = require('express');
const {
  registerTourist,
  loginTourist
} = require('../controllers/authController');

const router = express.Router();

router.post('/register',registerTourist);
router.post("/login", loginTourist);

module.exports = router;