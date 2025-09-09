const express = require('express');
const { receiveGeofenceTransitions } = require('../controllers/geofenceController');
const { verifyToken: protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to receive geofence transitions from the tourist app
router.post('/transitions', protect, receiveGeofenceTransitions);

module.exports = router;