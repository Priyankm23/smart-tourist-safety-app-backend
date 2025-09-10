const Tourist = require("../models/User.js");
const { CustomError } = require('../middlewares/errorMiddleware');
const { decrypt } = require("../utils/encrypt.js");


// @desc    Get the authenticated tourist's profile
// @route   GET /api/tourist/profile
// @access  Private (tourist)

exports.getTouristById = async (req, res) => {
  try {
    const { touristId } = req.params;

    // Find tourist by touristId
    const tourist = await Tourist.findOne({ touristId });
    if (!tourist) {
      return res.status(404).json({ error: "Tourist not found" });
    }

    // Decrypt sensitive fields
    const safeData = {
      touristId: tourist.touristId,
      name: tourist.nameEncrypted ? decrypt(tourist.nameEncrypted) : null,
      phone: tourist.phoneEncrypted ? decrypt(tourist.phoneEncrypted) : null,
      email: tourist.emailEncrypted ? decrypt(tourist.emailEncrypted) : null,
      itinerary: tourist.itineraryEncrypted
        ? JSON.parse(decrypt(tourist.itineraryEncrypted))
        : null,
      emergencyContact: tourist.emergencyContactEncrypted
        ? JSON.parse(decrypt(tourist.emergencyContactEncrypted))
        : null,
      language: tourist.language,
      createdAt: tourist.createdAt,
      expiresAt: tourist.expiresAt,
      audit: tourist.audit // includes regHash + regTxHash
    };

    return res.status(200).json(safeData);
  } catch (err) {
    console.error("getTouristById error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
