const express = require('express');
const { receiveGeofenceTransitions ,createGeoFenceToDangerLocation, getallZones, getZonebyId} = require('../controllers/geofenceController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to receive geofence transitions from the tourist app
router.post('/transitions', verifyToken, receiveGeofenceTransitions);
router.post('/zone',verifyToken,createGeoFenceToDangerLocation);
router.get('/',getallZones);
router.get('/:id',verifyToken,getZonebyId);

module.exports = router;