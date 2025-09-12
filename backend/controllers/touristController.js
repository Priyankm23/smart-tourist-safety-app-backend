const Tourist = require("../models/Tourist.js");
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


