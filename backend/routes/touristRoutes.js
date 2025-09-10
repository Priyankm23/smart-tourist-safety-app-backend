const express = require('express');
const {
  updateTouristProfile,
  updateLocation,
  getTouristById
} = require('../controllers/touristController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// A middleware 'verifyToken' is used to ensure the user is authenticated
// The specific role-based authorization can be added here or in the controller.

router.get('/:touristId',verifyToken, getTouristById);
router.put('/profile/update', verifyToken, updateTouristProfile);
router.post('/location', verifyToken, updateLocation);

module.exports = router;