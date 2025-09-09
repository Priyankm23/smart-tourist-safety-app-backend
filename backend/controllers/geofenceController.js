const Transition = require('../models/Transition');
const { CustomError } = require('../middlewares/errorMiddleware');

// @desc    Receive and store user geofence transitions
// @route   POST /api/transitions
// @access  Private (tourist)
exports.receiveGeofenceTransitions = async (req, res, next) => {
  try {
    const { transitions } = req.body;

    if (!Array.isArray(transitions)) {
      return next(new CustomError(400, 'Transitions must be an array.'));
    }
    
    if (transitions.length === 0) {
      return res.status(200).json({ insertedCount: 0 });
    }

    // Add server-side timestamp and user ID
    const docs = transitions.map((t) => ({
      ...t,
      digitalId: req.user.digitalId,
      receivedAt: new Date(),
    }));

    const result = await Transition.insertMany(docs);
    
    res.status(201).json({
      message: 'Geofence transitions received successfully.',
      insertedCount: result.insertedCount,
    });
  } catch (err) {
    next(err);
  }
};