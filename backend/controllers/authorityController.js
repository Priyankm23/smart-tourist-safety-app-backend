const SOSAlert = require('../models/SOSalert');
const DangerZone = require("../models/Geofence");
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


/**
 * Get all SOS alerts (incident history) for a tourist
 * - Sorted by newest first
 * - Shows full timeline of incidents
 */
exports.getTouristSOSHistory = async (req, res) => {
  try {
    const { touristId } = req.params;

    const alerts = await SOSAlert.find({ touristId })
      .sort({ createdAt: -1 })
      .select("status location timestamp sosReason emergencyContact");

    if (!alerts || alerts.length === 0) {
      return res.status(404).json({ message: "No SOS history found for this tourist" });
    }

    res.json({
      touristId,
      totalIncidents: alerts.length,
      incidents: alerts
    });
  } catch (err) {
    console.error("getTouristSOSHistory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all risk zones for heat map overlays
 */
exports.getRiskZones = async (req, res) => {
  try {
    const zones = await DangerZone.find().select(
      "name type coords radiusKm category state riskLevel"
    );

    if (!zones || zones.length === 0) {
      return res.status(404).json({ message: "No risk zones found" });
    }

    res.json({
      totalZones: zones.length,
      zones
    });
  } catch (err) {
    console.error("getRiskZones error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get active SOS alerts for heat map visualization
 */
exports.getSOSHeatmapData = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ status: "new" }) // only active/new SOS
      .select("location sosReason status timestamp touristId");

    if (!alerts || alerts.length === 0) {
      return res.json({ message: "No active SOS alerts", alerts: [] });
    }

    // Transform for frontend mapping library
    const heatmapData = alerts.map(alert => ({
      touristId: alert.touristId,
      lat: alert.location.coordinates[1],
      lng: alert.location.coordinates[0],
      status: alert.status,
      reason: alert.sosReason?.reason || "Unknown",
      timestamp: alert.timestamp
    }));

    res.json({ total: heatmapData.length, alerts: heatmapData });
  } catch (err) {
    console.error("getSOSHeatmapData error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTouristLocations = async (req, res) => {
  try {
    // Fetch all recent or active SOS alerts
    const alerts = await SOSAlert.find({
      status: { $in: ["new", "acknowledged", "responding"] }
    })
    .select("location.coordinates sosReason timestamp touristId") // include extra info if needed
    .lean();

    // Map coordinates to [lat, lng] array for heatmap
    const heatmapData = alerts.map(alert => {
      return [alert.location.coordinates[1], alert.location.coordinates[0]]; // Leaflet expects [lat, lng]
    });

    res.json(heatmapData);
  } catch (err) {
    console.error("Error fetching tourist locations:", err);
    res.status(500).json({ error: "Server error" });
  }
};



