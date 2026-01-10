const RiskGrid = require('../models/RiskGrid');
const Incident = require('../models/Incident');
const SOSAlert = require('../models/SOSalert');

// Constants
const GRID_SIZE_DEG = 0.027; // Approx 3km (Increased from 500m to cover larger tourist spots)
const LAMBDA = 0.01; // Time decay factor (Reduced for 7-day persistence)

// Weights (Tuned to reduce News bias)
const W_NEWS = 0.25;  // Reduced from 0.4
const W_SOS = 0.65;   // Increased to prioritize real-time user safety
const W_HISTORY = 0.1;

/**
 * Convert lat/lng to a fixed grid ID and center point
 */
function getGridIdAndCenter(lat, lng) {
    const snapedLat = Math.floor(lat / GRID_SIZE_DEG) * GRID_SIZE_DEG + (GRID_SIZE_DEG / 2);
    const snapedLng = Math.floor(lng / GRID_SIZE_DEG) * GRID_SIZE_DEG + (GRID_SIZE_DEG / 2);
    return {
        gridId: `${snapedLat.toFixed(5)}_${snapedLng.toFixed(5)}`,
        center: [snapedLng, snapedLat]
    };
}

/**
 * Core Logic: Update Risk Scores for all active grids
 */
async function updateRiskScores() {
    console.log("🔄 Running Global Risk Update Job...");

    // 1. Identify all grids that need updates (from recent activity or existing records)
    const activeGridIds = new Set();
    
    // A. Grids with recent SOS alerts (last 7 days)
    const recentSOS = await SOSAlert.find({ 
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });
    recentSOS.forEach(alert => {
        if(alert.location && alert.location.coordinates) {
            const { gridId } = getGridIdAndCenter(alert.location.coordinates[1], alert.location.coordinates[0]);
            activeGridIds.add(gridId);
        }
    });

    // B. Grids with recent Incidents (last 7 days)
    const recentIncidents = await Incident.find({
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    recentIncidents.forEach(inc => {
        if(inc.location && inc.location.coordinates) {
            const { gridId } = getGridIdAndCenter(inc.location.coordinates[1], inc.location.coordinates[0]);
            activeGridIds.add(gridId);
        }
    });
    
    // C. Existing grids (to update decay)
    const existingGrids = await RiskGrid.find({});
    existingGrids.forEach(g => activeGridIds.add(g.gridId));

    console.log(`Analyzing ${activeGridIds.size} active grids...`);

    // 2. Process each grid
    for (const gid of activeGridIds) {
        await processGrid(gid);
    }
    console.log("✅ Risk Update Complete.");
}

/**
 * Calculate risk for a single grid cell
 */
async function processGrid(gridId) {
    const [latStr, lngStr] = gridId.split('_');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // --- 1. SOS Cluster Component ---
    // Count SOS alerts within 2000m radius in last 7 days (Extended from 30 mins)
    const sosHighPriority = await SOSAlert.countDocuments({
        location: {
            $geoWithin: {
                $centerSphere: [ [lng, lat], 2000 / 6378100 ] // 2000 meters in radians
            }
        },
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });
    
    // 3 SOS alerts = Max Risk (1.0)
    let sosScore = Math.min(sosHighPriority / 3, 1.0);


    // --- 2. News/Incident Component ---
    // Search larger radius (3.5km) for news, decays over 7 days (Extended from 24h)
    const incidents = await Incident.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [lng, lat], 3500 / 6378100 ] // 3500 meters in radians
            }
        },
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    let newsScore = 0;
    if (incidents.length > 0) {
        const totalImpact = incidents.reduce((acc, inc) => {
            const hoursAgo = (Date.now() - inc.timestamp) / (1000 * 60 * 60);
            return acc + (inc.severity * Math.exp(-LAMBDA * hoursAgo));
        }, 0);
        newsScore = Math.min(totalImpact, 1.0);
    }


    // --- 3. Historical Component ---
    let historyScore = 0;
    const prevGrid = await RiskGrid.findOne({ gridId });
    if (prevGrid) {
        // Get previous score but apply time decay
        // If no new events, this will slowly drag the score down to 0
        const hoursSinceUpdate = (Date.now() - prevGrid.lastUpdated) / (1000 * 60 * 60);
        historyScore = prevGrid.riskScore * Math.exp(-0.1 * hoursSinceUpdate); 
    }

    // --- Final Calculation ---
    // Combine and clamp
    // E.g. (0.4 * news) + (0.6 * sos) + (0.2 * history) 
    // Max sum ~1.2, clamped to 1.0.
    
    let finalScore = (W_NEWS * newsScore) + (W_SOS * sosScore) + (W_HISTORY * historyScore);
    
    // Extra Logic: If there is an active SOS cluster, force HIGH risk regardless of history
    if (sosHighPriority >= 3) {
        finalScore = Math.max(finalScore, 0.85); // Force Very High
    }

    finalScore = Math.min(Math.max(finalScore, 0), 1);

    // Map to Levels
    let level = 'Low';
    if (finalScore >= 0.8) level = 'Very High';
    else if (finalScore >= 0.6) level = 'High';
    else if (finalScore >= 0.3) level = 'Medium';

    // Save to DB
    await RiskGrid.findOneAndUpdate(
        { gridId },
        {
            location: { type: "Point", coordinates: [lng, lat] },
            riskScore: finalScore,
            riskLevel: level,
            lastUpdated: new Date()
        },
        { upsert: true, new: true }
    );
}

module.exports = { updateRiskScores, getGridIdAndCenter };
