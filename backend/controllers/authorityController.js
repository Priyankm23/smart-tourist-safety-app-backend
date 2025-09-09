const SosAlert = require('../models/SOSalert');
const Log = require('../models/Logs');
const { CustomError } = require('../middlewares/errorMiddleware');

// @desc    Get all open SOS alerts
// @route   GET /api/authority/alerts
// @access  Private (authority)
exports.getOpenSosAlerts = async (req, res, next) => {
  try {
    const alerts = await SosAlert.find({ status: 'open' }).sort({ timestamp: -1 });
    res.status(200).json(alerts);
  } catch (err) {
    next(err);
  }
};

// @desc    Get details for a specific SOS alert
// @route   GET /api/authority/alerts/:id
// @access  Private (authority)
exports.getSosAlertDetails = async (req, res, next) => {
  try {
    const alert = await SosAlert.findById(req.params.id);
    if (!alert) {
      return next(new CustomError(404, 'SOS alert not found.'));
    }
    res.status(200).json(alert);
  } catch (err) {
    next(err);
  }
};

// @desc    Update the status of an SOS alert (e.g., in-progress, resolved)
// @route   PUT /api/authority/alerts/:id/status
// @access  Private (authority)
exports.updateSosAlertStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return next(new CustomError(400, 'Status is required.'));
    }
    const alert = await SosAlert.findByIdAndUpdate(req.params.id, {
      status,
      assignedTo: req.user.id,
    }, { new: true });
    
    if (!alert) {
      return next(new CustomError(404, 'SOS alert not found.'));
    }
    
    // Log the action for auditability
    const log = new Log({
      type: 'SOS_STATUS_UPDATE',
      performedBy: req.user.id,
      description: `SOS alert ${req.params.id} status updated to ${status}.`,
      relatedAlert: alert._id,
      notes: notes,
    });
    await log.save();

    res.status(200).json({ message: `Alert status updated to ${status}.`, alert });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logs for a specific SOS alert
// @route   GET /api/authority/alerts/:id/logs
// @access  Private (authority)
exports.getAlertLogs = async (req, res, next) => {
  try {
    const logs = await Log.find({ relatedAlert: req.params.id }).sort({ timestamp: 1 });
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};