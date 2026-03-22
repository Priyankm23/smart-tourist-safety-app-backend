const { decrypt } = require('../../utils/encrypt');
const Transition = require('../../models/Transition');
const Incident = require('../../models/Incident');
const RiskGrid = require('../../models/RiskGrid');
const Authority = require('../../models/Authority');
const SOSAlert = require('../../models/SOSAlertModel');

// @desc    Get real-time map data (Tourists, Zones, Alerts, Incidents)
// @route   GET /api/authority/map-overview
// @access  Private (authority)
exports.getMapOverview = async (req, res, next) => {
  try {
    // 1. Fetch Aggregated stats for the panel
    const totalTourists = await Tourist.countDocuments();
    const activeAlertsCount = await SOSAlert.countDocuments({ status: { $in: ['new', 'responding'] } });
    const highRiskZonesCount = await DangerZone.countDocuments({ riskLevel: { $in: ['High', 'Very High'] } });
    const responseUnitsCount = await Authority.countDocuments({ role: { $in: ['Emergency Responder', 'Police Officer'] }, isActive: true });

    // 2. Fetch Tourists with their latest location
    // We get the latest transition for each tourist to pinpoint them on the map
    const latestTransitions = await Transition.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$digitalId",
          location: { $first: "$location" },
          timestamp: { $first: "$timestamp" }
        }
      }
    ]);

    // Create a map for quick lookup of location by touristId
    const locMap = {};
    latestTransitions.forEach(t => {
      locMap[t._id] = t.location; // { latitude, longitude }
    });

    const touristsRaw = await Tourist.find({}).select('touristId nameEncrypted safetyScore expiresAt').lean();

    const tourists = touristsRaw.map(t => {
      const loc = locMap[t.touristId];
      let name = "Unknown";
      try {
        if (t.nameEncrypted) name = decrypt(t.nameEncrypted);
      } catch (e) { }

      const isActive = t.expiresAt && new Date(t.expiresAt) > new Date();

      // Let's exclude tourists with no location history for the map view.
      if (!loc) return null;

      return {
        id: t.touristId,
        name: name,
        status: isActive ? 'active' : 'expired',
        safetyScore: t.safetyScore,
        location: {
          lat: loc.latitude,
          lng: loc.longitude
        },
        type: 'tourist'
      };
    }).filter(t => t !== null);


    // 3. Fetch Danger Zones
    const zonesRaw = await DangerZone.find({}).lean();
    const zones = zonesRaw.map(z => ({
      id: z.id,
      name: z.name,
      riskLevel: z.riskLevel,
      type: 'zone',
      shape: z.type, // 'circle' or 'polygon'
      coordinates: z.coords, // [lat, lng]
      radius: z.radiusKm ? z.radiusKm * 1000 : 0 // Convert to meters for map
    }));

    // 4. Fetch Active SOS Alerts
    const alertsRaw = await SOSAlert.find({ status: { $in: ['new', 'responding'] } }).populate('touristId', 'touristId').lean();
    const activeAlerts = alertsRaw.map(a => {
      // SOSAlert uses GeoJSON [lng, lat]
      const lat = a.location.coordinates[1];
      const lng = a.location.coordinates[0];
      return {
        id: a._id,
        type: 'alert',
        status: a.status,
        priority: a.safetyScore < 50 ? 'high' : 'medium',
        location: { lat, lng },
        locationName: a.location.locationName || "Unknown Location"
      };
    });

    // 5. Fetch Risk Grids (Heatmap points)
    const riskGridRaw = await RiskGrid.find({ riskScore: { $gt: 0 } }).lean();
    const riskGrids = riskGridRaw.map(r => ({
      location: {
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0]
      },
      intensity: r.riskScore // 0 to 1
    }));

    // 6. Fetch Incidents
    const incidentsRaw = await Incident.find({}).sort({ timestamp: -1 }).limit(50).lean();
    const incidents = incidentsRaw.map(i => ({
      id: i._id,
      title: i.title,
      type: 'incident',
      category: i.type,
      location: {
        lat: i.location.coordinates[1],
        lng: i.location.coordinates[0]
      }
    }));


    res.status(200).json({
      success: true,
      stats: {
        totalTourists,
        activeAlerts: activeAlertsCount,
        highRiskZones: highRiskZonesCount,
        responseUnits: responseUnitsCount
      },
      mapData: {
        tourists,
        zones,
        activeAlerts,
        riskGrids,
        incidents
      }
    });

  } catch (err) {
    console.error("❌ getMapOverview error:", err);
    next(err);
  }
};



