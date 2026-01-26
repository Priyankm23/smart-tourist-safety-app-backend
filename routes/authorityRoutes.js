const express = require('express');
const {
  getNewSosAlerts,
  getSosCounts,
  getDashboardStats,
  getTouristManagementData,
  revokeTourist,
  getMapOverview,
  signUp, signIn, verify, logOut,
  assignUnitToAlert
} = require('../controllers/authorityController');
const { verifyToken, isAuthority } = require('../middlewares/authMiddleware');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
router.get('/dashboard-stats', verifyToken, isAuthority, getDashboardStats);
router.get('/tourist-management', verifyToken, isAuthority, getTouristManagementData);
router.get('/map-overview', verifyToken, isAuthority, getMapOverview);
router.delete('/revoke/:id', verifyToken, isAuthority, revokeTourist);
router.get('/alerts', verifyToken, isAuthority, getNewSosAlerts);
router.put('/alerts/:id/assign', verifyToken, isAuthority, assignUnitToAlert);

router.post("/signup", signUp);
router.post("/login", signIn);
router.get('/me', verifyToken, verify);
router.post('/logout', logOut);


router.get('/count', getSosCounts);


module.exports = router;

