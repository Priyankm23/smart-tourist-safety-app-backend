const express = require('express');
const { assignUnitToAlert, getRespondingSosAlerts, getNewSosAlerts, resolveAlert,getSosCounts } = require('../controllers/authority/SOSAlertPage')
const { getExpiredTouristData, getTouristManagementData, revokeTourist } = require('../controllers/authority/touristPage')
const { getDashboardStats } = require('../controllers/authority/dashboard')
const { getMapOverview } = require('../controllers/authority/mapPage')
const { signIn, signUp, logOut, verify } = require('../controllers/authority/authPage')
const { predictCrowdSurge } = require('../controllers/authority/analytics');
const { createEFIR, getEFIRSummaries } = require('../controllers/authority/eFIRPage');
const { createGeoFenceToDangerLocation } = require('../controllers/geofenceController');
const { verifyToken, isAuthority } = require('../middlewares/authMiddleware');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics/crowd-prediction', verifyToken, isAuthority, predictCrowdSurge);
router.get('/tourist-management', getTouristManagementData);
router.get('/expired-tourists', verifyToken, isAuthority, getExpiredTouristData);
router.get('/map-overview', verifyToken, isAuthority, getMapOverview);
router.post('/map/danger-zone', verifyToken, isAuthority, createGeoFenceToDangerLocation);
router.get('/efir', verifyToken, isAuthority, getEFIRSummaries);
router.post('/efir', verifyToken, isAuthority, createEFIR);
router.delete('/revoke/:id', verifyToken, isAuthority, revokeTourist);
router.get('/alerts', verifyToken, isAuthority, getNewSosAlerts);
router.get('/alerts/responding', verifyToken, isAuthority, getRespondingSosAlerts);
router.put('/alerts/:id/assign', verifyToken, isAuthority, assignUnitToAlert);
router.put('/alerts/:id/resolve', verifyToken, isAuthority, resolveAlert);

router.post("/signup", signUp);
router.post("/login", signIn);
router.get('/me', verifyToken, verify);
router.post('/logout', logOut);


router.get('/count', getSosCounts);


module.exports = router;

