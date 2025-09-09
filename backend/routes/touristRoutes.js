const express = require('express');
const {
  getTouristProfile,
  updateTouristProfile,
  updateLocation,
} = require('../controllers/touristController');
const { verifyToken: protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// A middleware 'protect' is used to ensure the user is authenticated
// The specific role-based authorization can be added here or in the controller.

router.get('/profile/me', protect, getTouristProfile);
router.put('/profile/update', protect, updateTouristProfile);

router.post('/location', protect, updateLocation);

module.exports = router;