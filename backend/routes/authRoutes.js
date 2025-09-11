const express = require('express');
const {
  registerTourist,
  loginTourist
} = require('../controllers/authController');
const { verifyTouristRecord } = require('../controllers/verifyController');

const router = express.Router();

router.post('/register',registerTourist);
router.post("/login", loginTourist);
router.get('/verify/:touristId',verifyTouristRecord);

module.exports = router;