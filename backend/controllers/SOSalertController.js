const SosAlert = require('../models/SOSalert');
const { logToBlockchain } = require('../services/blockchain.service');
const {CustomError} = require('../middlewares/errorMiddleware');

// @desc    Create a new SOS alert
// @route   POST /api/sos
// @access  Private (tourist)
exports.createSosAlert = async (req, res, next) => {
  try {
    const { location } = req.body;
    const { digitalId } = req.user; 
    
    if (!location || !location.latitude || !location.longitude) {
      return next(new CustomError(400, 'Location data is required.'));
    }

    const newAlert = new SosAlert({ 
      digitalId,
      location,
      timestamp: new Date()
    });

    await newAlert.save();

    // Log the event to the blockchain in the background
    // Don't wait for this to finish to avoid latency
    logToBlockchain(newAlert._id.toString(), newAlert.digitalId);

    res.status(201).json({
      message: 'SOS alert created successfully. Help is on the way!',
      alertId: newAlert._id,
    });
  } catch (err) {
    next(err);
  }
};