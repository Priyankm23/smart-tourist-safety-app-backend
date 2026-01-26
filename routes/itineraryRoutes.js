const express = require('express');
const router = express.Router();
const { verifyToken ,isSolo} = require('../middlewares/authMiddleware');
const itineraryController = require('../controllers/itineraryController');

// Get user's itinerary
router.get('/', verifyToken, isSolo,itineraryController.getItinerary);

// Create itinerary if none exists
router.post('/:id',itineraryController.addItinerary);

// Replace entire itinerary
router.put('/', verifyToken, isSolo,itineraryController.replaceItinerary);

// Update single day (upsert)
router.put('/day/:dayNumber', verifyToken, isSolo,itineraryController.updateDay);

// Clear itinerary
router.delete('/', verifyToken, isSolo,itineraryController.clearItinerary);

module.exports = router;
