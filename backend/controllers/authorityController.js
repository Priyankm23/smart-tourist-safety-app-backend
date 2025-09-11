const SOSAlert = require('../models/SOSalert');
const { CustomError } = require('../middlewares/errorMiddleware');

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

// @desc    Get details for a specific SOS alert
// @route   GET /api/authority/alerts/:id
// @access  Private (authority)
exports.getSosAlertDetails = async (req, res, next) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert) {
      return next(new CustomError(404, 'SOS alert not found.'));
    }
    res.status(200).json(alert);
  } catch (err) {
    next(err);
  }
};


