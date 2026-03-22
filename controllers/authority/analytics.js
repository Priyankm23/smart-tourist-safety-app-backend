const Tourist = require('../../models/Tourist');
const TourGroup = require('../../models/TourGroup');
const mongoose = require('mongoose');
const { DangerZone } = require('../../models/Geofence');
const realtimeService = require('../../services/realtimeService');

// Helper function to calculate distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @desc    Get medical and vulnerability profile of tourists in Danger Zones
// @route   GET /api/authority/analytics/medical-profiling
// @access  Private (authority)
exports.getMedicalProfiling = async (req, res, next) => {
  try {
    // 1. Fetch active High/Very High Danger Zones
    const activeDangerZones = await DangerZone.find({
      riskLevel: { $in: ['High', 'Very High'] }
    });

    if (activeDangerZones.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active high-risk zones currently.",
        data: {
          totalAtRisk: 0,
          medicalBreakdown: {},
          vulnerableTourists: []
        }
      });
    }

    // 2. Get real-time tourist locations
    const touristLocationsMap = realtimeService.getTouristLocations();
    const touristsInDanger = []; // Store touristIds

    // 3. Find which tourists are inside the danger zones right now
    for (const [touristId, locData] of touristLocationsMap.entries()) {
      if (!locData || !locData.lat || !locData.lng) continue;

      let isInDanger = false;
      let matchedZoneName = "";

      for (const zone of activeDangerZones) {
        // Danger zone coords are [lat, lng]
        if (zone.coords && zone.coords.length === 2 && zone.radiusKm) {
          const dist = calculateDistanceKm(locData.lat, locData.lng, zone.coords[0], zone.coords[1]);
          if (dist <= zone.radiusKm) {
            isInDanger = true;
            matchedZoneName = zone.name;
            break;
          }
        }
      }

      if (isInDanger) {
        touristsInDanger.push({ touristId, zoneName: matchedZoneName });
      }
    }

    if (touristsInDanger.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tourists are currently detected within high-risk zones.",
        data: {
          totalAtRisk: 0,
          medicalBreakdown: {},
          vulnerableTourists: []
        }
      });
    }

    // 4. Fetch the medical profile of these specific tourists from DB
    const idsToFetch = touristsInDanger.map(t => t.touristId);
    const touristsData = await Tourist.find({ touristId: { $in: idsToFetch } })
      .select('touristId bloodGroup medicalConditions allergies dob');

    // 5. Aggregate insights
    let vulnerableCount = 0;
    const medicalBreakdown = {
      hasMedicalConditions: 0,
      hasAllergies: 0,
      bloodGroups: {},
      elderly: 0 // Age > 60
    };

    const vulnerableDetails = [];

    touristsData.forEach(t => {
      let isVulnerable = false;
      const zoneName = touristsInDanger.find(x => x.touristId === t.touristId)?.zoneName || "Unknown";

      // Age categorization
      let isElderly = false;
      let age = "Unknown";
      if (t.dob) {
        age = new Date().getFullYear() - new Date(t.dob).getFullYear();
        if (age >= 60) {
          medicalBreakdown.elderly++;
          isElderly = true;
          isVulnerable = true;
        }
      }

      const hasCond = t.medicalConditions && t.medicalConditions.trim().length > 0;
      const hasAllergy = t.allergies && t.allergies.trim().length > 0;

      if (hasCond) {
        medicalBreakdown.hasMedicalConditions++;
        isVulnerable = true;
      }
      if (hasAllergy) {
        medicalBreakdown.hasAllergies++;
        isVulnerable = true;
      }

      if (t.bloodGroup) {
        medicalBreakdown.bloodGroups[t.bloodGroup] = (medicalBreakdown.bloodGroups[t.bloodGroup] || 0) + 1;
      }

      if (isVulnerable) {
        vulnerableCount++;
        vulnerableDetails.push({
          touristId: t.touristId,
          zone: zoneName,
          age: age,
          bloodGroup: t.bloodGroup || "Unknown",
          conditions: t.medicalConditions || "None",
          allergies: t.allergies || "None"
        });
      }
    });

    const summaryMessage = vulnerableCount > 0 
      ? `Critical: ${vulnerableCount} tourists with potential medical vulnerabilities are currently inside High-Risk zones. Consider dispatching medical units.`
      : `${touristsInDanger.length} tourists in High-Risk zones, but no severe medical vulnerabilities detected.`;

    res.status(200).json({
      success: true,
      message: "Medical profiling completed.",
      data: {
        summary: summaryMessage,
        totalAtRisk: touristsInDanger.length,
        totalVulnerable: vulnerableCount,
        medicalBreakdown,
        vulnerableTourists: vulnerableDetails // Detailed list for exact dispatching
      }
    });

  } catch (err) {
    console.error("❌ getMedicalProfiling error:", err);
    next(err);
  }
};

// @desc    Get forward-looking crowd prediction based on itineraries
// @route   GET /api/authority/analytics/crowd-prediction
// @access  Private (authority)
exports.predictCrowdSurge = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate tomorrow's date range
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    // Aggregate locations specifically planned for tomorrow across all active tourists
    const predictionPipeline = [
      // Step 1: Filter out expired tourists
      { 
        $match: { 
          expiresAt: { $gt: new Date() } 
        } 
      },
      // Step 2: Unwind the dayWiseItinerary array to examine individual days
      { 
        $unwind: {
          path: "$dayWiseItinerary",
          preserveNullAndEmptyArrays: false
        }
      },
      // Step 3: Match only the itinerary days that fall on tomorrow
      { 
        $match: { 
          "dayWiseItinerary.date": { 
            $gte: tomorrowStart, 
            $lt: tomorrowEnd 
          } 
        } 
      },
      // Step 4: Unwind the nodes (places to visit/stay) for that specific day
      { 
        $unwind: {
          path: "$dayWiseItinerary.nodes",
          preserveNullAndEmptyArrays: false
        }
      },
      // Step 5: Group by the location name and summarize
      { 
        $group: {
          _id: {
            name: "$dayWiseItinerary.nodes.name",
            // Also grouping by coordinates slightly rounded to treat nearby points as the same location
            // Using a simple rounding for longitude/latitude
            lat: { $round: [{ $arrayElemAt: ["$dayWiseItinerary.nodes.location.coordinates", 1] }, 3] },
            lng: { $round: [{ $arrayElemAt: ["$dayWiseItinerary.nodes.location.coordinates", 0] }, 3] }
          },
          expectedTourists: { $sum: 1 },
          types: { $addToSet: "$dayWiseItinerary.nodes.type" }
        }
      },
      // Step 6: Format output and sort by highest expected crowd
      {
        $project: {
          _id: 0,
          locationName: "$_id.name",
          coordinates: ["$_id.lng", "$_id.lat"],
          expectedTourists: 1,
          mainActivityTypes: {
            // Count frequency of activity types (visit, stay, transit, etc)
            $setUnion: ["$types"]
          }
        }
      },
      { $sort: { expectedTourists: -1 } },
      { $limit: 10 } // Top 10 predicted hot spots
    ];

    const predictedHotspots = await Tourist.aggregate(predictionPipeline);

    // Generate insight message
    let predictionMessage = "No significant crowds predicted for tomorrow.";
    if (predictedHotspots.length > 0) {
      const topSpot = predictedHotspots[0];
      predictionMessage = `High density expected at ${topSpot.locationName} tomorrow: ${topSpot.expectedTourists} tourists have it in their itinerary.`;
    }

    res.status(200).json({
      success: true,
      message: "Proactive crowd prediction generated successfully.",
      data: {
        summary: predictionMessage,
        targetDate: tomorrowStart.toISOString().split('T')[0],
        hotspots: predictedHotspots
      }
    });

  } catch (err) {
    console.error("❌ predictCrowdSurge error:", err);
    next(err);
  }
};
