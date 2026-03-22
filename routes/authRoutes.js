const express = require('express');
const {
  registerTourist,
  loginTourist,
  loginWithCodes,
  generateTouristQR,
  scanTouristQR,
} = require('../controllers/authController');
const { verifyTouristRecord } = require('../controllers/verifyController');

const router = express.Router();

router.post('/register',registerTourist);
router.post("/login", loginTourist);
router.post("/login-with-codes", loginWithCodes);
router.get('/verify/:touristId',verifyTouristRecord);
router.get('/qr/:touristId', generateTouristQR);
router.get('/qr/scan/:token', scanTouristQR);

module.exports = router;