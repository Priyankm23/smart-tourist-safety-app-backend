// backend/models/Tourist.js
const mongoose = require("mongoose");

const TouristSchema = new mongoose.Schema({
  touristId: { type: String, required: true, unique: true }, // internal id like T1001
  nameEncrypted: { type: String, required: true }, // AES encrypted
  govIdHash: { type: String, required: true }, // SHA256 hash of Aadhaar/passport
  phoneEncrypted: { type: String, required: true }, // AES encrypted
  email: { type: String, required: true, unique: true }, // AES encrypted

  // ==========================================================
  // 🟢 NEW: END-USER ROLE MANAGEMENT
  // ==========================================================
  role: {
    type: String,
    enum: ["solo", "tour-admin", "group-member"],
    default: "solo",
  },

  // Linked Group Data
  ownedGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "TourGroup" }, // If tour-admin
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "TourGroup" }, // If group-member

  // For Solo Travelers / Commuters (Dead Man's Switch)
  preferences: {
    safePulseFrequency: { type: Number, default: 0 }, // 0 = disabled, 15 = check every 15m
    commuterRoute: {
      start: { type: [Number] }, // [lng, lat]
      end: { type: [Number] },
    },
  },

  // 📝 ITINERARY STORAGE
  // For 'Solo': Stores personal itinerary (Encrypted JSON consistent with TourGroup format)
  // For 'Group Member': Empty (Inherits from TourGroup)
  dayWiseItineraryEncrypted: {
    type: [String],
    default: [],
  },

  // Removed 'tripMembersEncrypted' as it is now handled by TourGroup model

  emergencyContactEncrypted: { type: String }, // AES encrypted
  passwordHash: { type: String, required: true }, // bcrypt hashed password
  language: { type: String, default: "en" },
  safetyScore: { type: Number, default: 80 }, // initial tourist safety score
  consent: {
    tracking: { type: Boolean, default: false },
    dataRetention: { type: Boolean, default: true },
    emergencySharing: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // end of trip
  audit: {
    regHash: { type: String }, // SHA256 hash that was written to blockchain
    regTxHash: { type: String }, // blockchain tx hash
    eventId: { type: String },
    itineraryHash: { type: String },
    registeredAtIso: { type: String },
  },
});

module.exports = mongoose.model("Tourist", TouristSchema);
