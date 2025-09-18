const express = require('express');
const {
  getNewSosAlerts,
} = require('../controllers/authorityController');
const {verifyToken, isAuthority } = require('../middlewares/authMiddleware');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
router.get('/alerts',getNewSosAlerts);


module.exports = router;

