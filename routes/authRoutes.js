const express = require('express');
const {
  registerTourist,
  loginTourist,
  loginWithCodes
} = require('../controllers/authController');
const { verifyTouristRecord } = require('../controllers/verifyController');

const router = express.Router();

router.post('/register',registerTourist);
router.post("/login", loginTourist);
router.post("/login-with-codes", loginWithCodes);
router.get('/verify/:touristId',verifyTouristRecord);

module.exports = router;