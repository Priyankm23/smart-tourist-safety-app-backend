const express = require('express');
// const {
//   getNewSosAlerts,
//   getSosAlertDetails,
// } = require('../controllers/authorityController');
// const {verifyToken, isAuthority } = require('../middlewares/authMiddleware');
const {getSOSHeatmapData , getTouristLocations} = require('../controllers/authorityController');

const router = express.Router();

// The 'authorize' middleware checks if the authenticated user has the 'authority' role
// router.route('/alerts')
//   .get(getNewSosAlerts);

// router.route('/alerts/:id')
//   .get(verifyToken, isAuthority, getSosAlertDetails);

router.get("/heatmap", getSOSHeatmapData);
router.get("/tourist-locations",getTouristLocations);

module.exports = router;