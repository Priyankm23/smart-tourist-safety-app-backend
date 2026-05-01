const express = require('express');
const {
    registerTourist,
    loginTourist,
    loginWithCodes,
    generateTouristQR,
    scanTouristQR,
} = require('../controllers/authController');
const { verifyTouristRecord } = require('../controllers/verifyController');
const { authorityRegister,authorityLogin,authorityVerify,authorityLogOut } = require('../controllers/authority/authPage')
const {
    arcjetRegisterMiddleware,
    arcjetLoginMiddleware,
    arcjetGeneralMiddleware,
} = require("../middlewares/ArcjetMiddleware");

const router = express.Router();

// strict — blockchain write
router.post('/register', arcjetRegisterMiddleware, registerTourist);
router.post("/signup", arcjetRegisterMiddleware,authorityRegister);

// strict — auth routes
router.post("/login", arcjetLoginMiddleware, loginTourist);
router.post("/login-with-codes", arcjetLoginMiddleware, loginWithCodes);
router.post("/login-authority",arcjetLoginMiddleware, authorityLogin);

// relaxed — general routes
router.get('/verify/:touristId', arcjetGeneralMiddleware, verifyTouristRecord);
router.get('/qr/:touristId', arcjetGeneralMiddleware, generateTouristQR);
router.get('/qr/scan/:token', arcjetGeneralMiddleware, scanTouristQR);
router.get('/me',arcjetGeneralMiddleware, authorityVerify);

router.post('/logout',authorityLogOut);

module.exports = router;