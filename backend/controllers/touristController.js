const User = require('../models/User'); 
const { CustomError } = require('../middlewares/errorMiddleware');

// @desc    Get the authenticated tourist's profile
// @route   GET /api/tourist/profile
// @access  Private (tourist)
exports.getTouristProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new CustomError(404, 'User not found.'));
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a tourist's profile information
// @route   PUT /api/tourist/profile
// @access  Private (tourist)
exports.updateTouristProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, country, photoUrl } = req.body;
    const updateFields = { firstName, lastName, country, photoUrl };

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return next(new CustomError(404, 'User not found.'));
    }

    res.status(200).json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a tourist's current live location
// @route   POST /api/tourist/location
// @access  Private (tourist)
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return next(new CustomError(400, 'Latitude and longitude are required.'));
    }

    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { latitude, longitude, timestamp: new Date() },
    });

    res.status(200).json({ message: 'Location updated successfully.' });
  } catch (err) {
    next(err);
  }
};