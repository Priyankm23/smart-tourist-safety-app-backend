const express = require('express');
const {
  getOpenSosAlerts,
  getSosAlertDetails,
  updateSosAlertStatus,
  getAlertLogs,
} = require('../controllers/authorityController');
const {verifyToken: protect, isAuthority } = require('../middlewares/authMiddleware');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
router.route('/alerts')
  .get(protect,isAuthority, getOpenSosAlerts);

router.route('/alerts/:id')
  .get(protect, isAuthority, getSosAlertDetails);

router.route('/alerts/:id/status')
  .put(protect, isAuthority, updateSosAlertStatus);

router.route('/alerts/:id/logs')
  .get(protect, isAuthority, getAlertLogs);

module.exports = router;