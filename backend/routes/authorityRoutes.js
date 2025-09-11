const express = require('express');
const {
  getNewSosAlerts,
  getSosAlertDetails,
  updateSosAlertStatus,
} = require('../controllers/authorityController');
const {verifyToken, isAuthority } = require('../middlewares/authMiddleware');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
router.route('/alerts')
  .get(getNewSosAlerts);

router.route('/alerts/:id')
  .get(verifyToken, isAuthority, getSosAlertDetails);

module.exports = router;