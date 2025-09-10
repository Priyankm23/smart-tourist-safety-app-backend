const mongoose = require('mongoose');

const authoritySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  // RBAC for different authority levels
  role: {
    type: String,
    enum: ['police', 'higher-authority', 'admin'],
    required: true
  },
  policeStationId: { type: String ,required: true}, // Optional field for police officers
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Authority', authoritySchema);