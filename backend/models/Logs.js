const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'user-registration',
      'user-login',
      'sos-alert',
      'geofence-breach',
      'api-error',
      'blockchain-log-success',
      'blockchain-log-failure',
      'e-fir-generated',
    ],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  // Reference to the user or authority that triggered the event
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  // Details of the event
  details: { type: Object, required: true },
});

module.exports = mongoose.model('Log', logSchema);