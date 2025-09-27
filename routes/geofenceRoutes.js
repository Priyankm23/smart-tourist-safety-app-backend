const express = require('express');
const { receiveGeofenceTransitions ,createGeoFenceToDangerLocation, getallZones, getZonebyId,getHighRiskZoneCount} = require('../controllers/geofenceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const  DangerZone  = require('../models/Geofence');

const router = express.Router();

// Route to receive geofence transitions from the tourist app
router.post('/transitions', verifyToken, receiveGeofenceTransitions);

router.post('/zone',verifyToken,createGeoFenceToDangerLocation);

router.get('/',getallZones);

router.get('/count',getHighRiskZoneCount);

router.get('/:id',verifyToken,getZonebyId);

module.exports = router;