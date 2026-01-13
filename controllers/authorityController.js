const SOSAlert = require('../models/SOSalert');
const DangerZone = require("../models/Geofence");
const { CustomError } = require('../middlewares/errorMiddleware');
const Tourist = require('../models/Tourist');
const { decrypt } = require('../utils/encrypt');
const Transition = require('../models/Transition');
const Incident = require('../models/Incident');
const RiskGrid = require('../models/RiskGrid');
const Authority = require('../models/Authority');
const jwt = require('jsonwebtoken');
const { NODE_ENV } = require('../config/config')

// @desc    Get aggregated dashboard statistics
// @route   GET /api/authority/dashboard-stats
// @access  Private (authority)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. Active Tourists & Change
    const activeTouristsCount = await Tourist.countDocuments({ expiresAt: { $gt: new Date() } });

    // Approximation for 'yesterday': Active count at start of today (end of yesterday)
    const activeYesterdayCount = await Tourist.countDocuments({
      createdAt: { $lt: startOfToday },
      expiresAt: { $gt: startOfToday }
    });

    const activeDiff = activeTouristsCount - activeYesterdayCount;
    const activePercentChange = activeYesterdayCount > 0
      ? ((activeDiff / activeYesterdayCount) * 100).toFixed(1)
      : activeDiff > 0 ? "100" : "0";

    // 2. SOS Alerts Today & Change
    const sosTodayCount = await SOSAlert.countDocuments({
      timestamp: { $gte: startOfToday }
    });

    const sosYesterdayCount = await SOSAlert.countDocuments({
      timestamp: { $gte: startOfYesterday, $lt: startOfToday }
    });

    const sosDiff = sosTodayCount - sosYesterdayCount;
    const sosChangeLabel = sosDiff >= 0 ? `+${sosDiff} from yesterday` : `${sosDiff} from yesterday`;

    // 3. High-Risk Zones
    const highRiskZonesCount = await DangerZone.countDocuments({
      riskLevel: { $in: ['High', 'Very High'] }
    });

    // 4. Resolved Cases (This Month) & Change
    const resolvedThisMonth = await SOSAlert.countDocuments({
      status: { $in: ['resolved', 'closed'] },
      timestamp: { $gte: startOfMonth }
    });

    const resolvedLastMonth = await SOSAlert.countDocuments({
      status: { $in: ['resolved', 'closed'] },
      timestamp: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    const resolvedDiff = resolvedThisMonth - resolvedLastMonth;
    const resolvedPercentChange = resolvedLastMonth > 0
      ? ((resolvedDiff / resolvedLastMonth) * 100).toFixed(1)
      : resolvedDiff > 0 ? "100" : "0";

    // 5. Recent SOS Alerts
    const recentAlertsRaw = await SOSAlert.find({ status: { $ne: 'resolved' } })
      .sort({ timestamp: -1 })
      .limit(3)
      .populate('touristId', 'nameEncrypted touristId')
      .lean();

    const recentAlerts = recentAlertsRaw.map(alert => {
      let touristName = "Unknown Name";
      let displayId = "Unknown ID";

      if (alert.touristId && typeof alert.touristId === 'object') {
        displayId = alert.touristId.touristId;
        try {
          if (alert.touristId.nameEncrypted) {
            touristName = decrypt(alert.touristId.nameEncrypted);
          }
        } catch (e) {
          console.error("Decrypt error", e);
        }
      } else {
        // Fallback if not populated (though it should be)
        displayId = alert.touristId;
      }

      return {
        id: alert._id,
        touristId: displayId,
        touristName: touristName,
        location: alert.location && alert.location.locationName ? alert.location.locationName :
          (alert.location && alert.location.coordinates ? `${alert.location.coordinates[1]}, ${alert.location.coordinates[0]}` : 'Unknown Location'),
        status: alert.status, // new, responded
        timestamp: alert.timestamp,
        reason: alert.sosReason ? alert.sosReason.reason : 'SOS Alert',
        priority: (alert.safetyScore && alert.safetyScore < 40) ? 'CRITICAL' : ((alert.safetyScore && alert.safetyScore < 70) ? 'MEDIUM' : 'LOW'),
        isNew: alert.status === 'new'
      };
    });

    // 6. Tourist Status Overview
    const touristsRaw = await Tourist.find({}).sort({ createdAt: -1 }).limit(5).lean();

    const touristOverview = touristsRaw.map((t) => {
      let name = "Unknown";
      try {
        if (t.nameEncrypted) name = decrypt(t.nameEncrypted);
      } catch (e) {
        console.error("Decrypt error", e);
      }

      const isActive = t.expiresAt && new Date(t.expiresAt) > new Date();

      return {
        id: t.touristId,
        name: name,
        safetyScore: t.safetyScore,
        status: isActive ? "ACTIVE" : "EXPIRED",
        regTxHash: t.audit ? t.audit.regTxHash : "N/A"
      };
    });

    res.status(200).json({
      success: true,
      data: {
        activeTourists: {
          count: activeTouristsCount,
          change: `${activePercentChange >= 0 ? '+' : ''}${activePercentChange}% from yesterday`
        },
        sosAlertsToday: {
          count: sosTodayCount,
          change: sosChangeLabel
        },
        highRiskZones: {
          count: highRiskZonesCount
        },
        resolvedCases: {
          count: resolvedThisMonth,
          change: `${resolvedPercentChange >= 0 ? '+' : ''}${resolvedPercentChange}% from last month`
        },
        recentAlerts,
        touristOverview
      }
    });

  } catch (err) {
    console.error("❌ getDashboardStats error:", err);
    next(err);
  }
};


// @desc    Get tourist management dashboard data (Counts + Registry)
// @route   GET /api/authority/tourist-management
// @access  Private (authority)
exports.getTouristManagementData = async (req, res, next) => {
  try {
    const { status, search } = req.query; // Optional filters

    // 1. Calculate Summary Stats
    const totalTourists = await Tourist.countDocuments();
    const activeTourists = await Tourist.countDocuments({ expiresAt: { $gt: new Date() } });
    const expiredTourists = await Tourist.countDocuments({ expiresAt: { $lte: new Date() } });

    // Average Safety Score
    const avgScoreResult = await Tourist.aggregate([
      { $group: { _id: null, avg: { $avg: "$safetyScore" } } }
    ]);
    const averageSafetyScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg) : 0;

    // 2. Fetch Tourist Registry List
    // Note: Search by name is limited due to encryption. We can search by ID directly.
    let query = {};
    if (status === 'active') {
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiresAt = { $lte: new Date() };
    }

    if (search) {
      // Simple search on touristId (which is plaintext)
      query.touristId = { $regex: search, $options: 'i' };
    }

    const touristsRaw = await Tourist.find(query).sort({ createdAt: -1 });

    const touristRegistry = touristsRaw.map(t => {
      let name = "Unknown";
      let phone = "Unknown";
      try {
        if (t.nameEncrypted) name = decrypt(t.nameEncrypted);
        if (t.phoneEncrypted) phone = decrypt(t.phoneEncrypted);
      } catch (e) {
        console.error(`Decrypt error for tourist ${t.touristId}:`, e.message);
      }

      const isActive = t.expiresAt && new Date(t.expiresAt) > new Date();

      return {
        id: t._id,
        touristId: t.touristId,
        name: name,
        phone: phone,
        country: "India",
        tripStart: t.createdAt,
        tripEnd: t.expiresAt,
        safetyScore: t.safetyScore,
        status: isActive ? "ACTIVE" : "EXPIRED",
        regTxHash: t.audit ? t.audit.regTxHash : "N/A"
      };
    });

    // If search parameter was provided and didn't match ID, let's try filtering by decrypted Name
    let filteredRegistry = touristRegistry;
    if (search && !query.touristId) {
      const searchLower = search.toLowerCase();
      filteredRegistry = touristRegistry.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.touristId.toLowerCase().includes(searchLower)
      );
    }


    res.status(200).json({
      success: true,
      data: {
        totalTourists,
        activeIDs: activeTourists,
        expiredIDs: expiredTourists,
        averageSafetyScore,
        registry: filteredRegistry
      }
    });

  } catch (err) {
    console.error("❌ getTouristManagementData error:", err);
    next(err);
  }
};

// @desc    Revoke and delete a tourist ID
// @route   DELETE /api/authority/revoke/:id
// @access  Private (authority)
exports.revokeTourist = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Reason for revocation is required" });
      }

      // "if reason is either convicted to misbehave / status expired then only delete"
      const normalizedReason = reason.toLowerCase();
      const validReason =
        normalizedReason.includes('misbehave') ||
        normalizedReason.includes('convicted') ||
        normalizedReason.includes('expired') ||
        normalizedReason.includes('complete');

      if (!validReason) {
        return res.status(400).json({
          success: false,
          message: "Action denied. Valid reasons: 'Convicted/Misbehavior' or 'Status Expired/Trip Completed'."
        });
      }

      const tourist = await Tourist.findById(id);

      if (!tourist) {
        return res.status(404).json({ success: false, message: "Tourist not found" });
      }

      await Tourist.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: `Tourist ${tourist.touristId} has been revoked and removed.`
      });

    } catch (err) {
      console.error("❌ revokeTourist error:", err);
      next(err);
    }
};


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
        } catch (e) {}

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
    const alertsRaw = await SOSAlert.find({ status: { $in: ['new', 'responding'] } }).lean();
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

exports.signUp = async (req,res,next)=>{
    try {
    const { username, fullName, email, password, role, authorityId } = req.body;

    if (!username || !fullName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    const allowedRoles = ["Police Officer", "Tourism Officer", "Emergency Responder", "System Administrator"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // If Police Officer, policeId is required
    // if (role === "Police Officer" && !authorityId) {
    //   return res.status(400).json({ message: "Police ID is required for Police Officer" });
    // }

    const existingUser = await Authority.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const newUser = new Authority({ username, fullName, email, password, role, authorityId });
    await newUser.save();

    res.status(201).json({ 
      message: "Signup successful. Please login to continue.", 
      user: { username, fullName, email, role, authorityId } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.signIn = async (req,res,next)=>{
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await Authority.findOne({ email });
    console.log("Login attempt for email:", email);
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log("Password match result:", isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax"
    });

    res.json({
      message: "Login successful",
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        authorityId: user.authorityId || null
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

exports.verify = async (req,res,next)=>{
  try {
    const user = await Authority.findById(req.authority.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        authorityId: user.authorityId || null,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get /me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

exports.logOut = async (req,res,next)=>{
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  return res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
}

// @desc    Get all open SOS alerts
// @route   GET /api/authority/alerts
// @access  Private (authority)
exports.getNewSosAlerts = async (req, res, next) => {
  try {
    // Fetch all SOS alerts with status 'new', sorted by latest timestamp first
    const alerts = await SOSAlert.find({ status: 'new' }).sort({ timestamp: -1 });

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
  } catch(err) {
     next(err);
  }
};
// @desc    Assign an authority unit to an SOS alert
// @route   PUT /api/authority/alerts/:id/assign
// @access  Private (authority)
exports.assignUnitToAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    // user.id or user._id depending on how it's stored in token. Usually user.id from decoded token.
    const authorityId = req.user.id || req.user._id; 

    const alert = await SOSAlert.findById(id);

    if (!alert) {
      return res.status(404).json({ success: false, message: "SOS Alert not found" });
    }

    // Check if already assigned to this authority
    if (alert.assignedTo && alert.assignedTo.includes(authorityId)) {
        return res.status(400).json({ success: false, message: "Unit already assigned to this alert" });
    }

    // Update alert: Add authority to assignedTo, change status to 'responding' if it was 'new'
    if (!alert.assignedTo) alert.assignedTo = [];
    alert.assignedTo.push(authorityId);
    
    if (alert.status === 'new' || alert.status === 'acknowledged') {
        alert.status = 'responding';
    }

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Unit assigned successfully",
      data: alert
    });

  } catch (err) {
    console.error("❌ assignUnitToAlert error:", err);
    next(err);
  }
};




