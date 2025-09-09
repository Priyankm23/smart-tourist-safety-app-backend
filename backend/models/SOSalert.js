const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  // Updated for GeoJSON compatibility
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere', // Geospatial index for faster queries
    },
  },
  timestamp: { type: Date, default: Date.now },
  blockchainTxHash: { type: String },
  isLoggedOnChain: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Authority' },
  metadata: { type: Object },
});

module.exports = mongoose.model('SosAlert', sosAlertSchema);