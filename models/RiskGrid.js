const mongoose = require('mongoose');

const riskGridSchema = new mongoose.Schema({
  gridId: { type: String, required: true, unique: true }, // Format: "lat_lng" of center
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, index: '2dsphere' } // [lng, lat]
  },
  riskScore: { type: Number, default: 0, min: 0, max: 1 },
  lastUpdated: { type: Date, default: Date.now },
  riskLevel: { type: String, enum: ["Low", "Medium", "High", "Very High"], default: "Low" },
  gridName: { type: String, default: "Unknown Zone" } // Human readable name
});

// Index for geospatial queries
riskGridSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RiskGrid', riskGridSchema);
