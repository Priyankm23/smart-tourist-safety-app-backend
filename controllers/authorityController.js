const SOSAlert = require('../models/SOSalert');
const DangerZone = require("../models/Geofence");
const { CustomError } = require('../middlewares/errorMiddleware');
const Tourist = require('../models/Tourist');

// @desc    Get all open SOS alerts
// @route   GET /api/authority/alerts
// @access  Private (authority)
exports.getNewSosAlerts = async (req, res, next) => {
  try {
    // Fetch all SOS alerts with status 'new', sorted by latest timestamp first
    const alerts = await SOSAlert.find({ status: 'new' }).sort({ timestamp: -1 });

    console.log("Alerts to send:", alerts)
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (err) {
    console.error("❌ getNewSosAlerts error:", err);
    next(err);
  }
};

exports.getSosCounts = async (req, res, next) => {
  try {
    const newCount = await SOSAlert.countDocuments({ status: "new" });

    res.status(200).json({
      success: true,
      new: newCount,
    });
  } catch (error) {
    next(error);
  }
};



