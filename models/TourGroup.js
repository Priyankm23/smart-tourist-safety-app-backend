const mongoose = require("mongoose");

// Sub-schema for individual itinerary nodes (Locations)
const ItineraryNodeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["stay", "visit", "transit", "start", "end"],
      required: true,
    },
    name: { type: String, required: true }, // Encryptable in future if needed
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat] for GeoJSON
    },
    address: { type: String },
    scheduledTime: { type: String }, // e.g., "14:00"
    description: { type: String },
  },
  { _id: false },
);

// Sub-schema for a single day
const DayAppointSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    dayNumber: { type: Number, required: true },
    nodes: [ItineraryNodeSchema], // Chronological list of stops
  },
  { _id: false },
);

const TourGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },

  // The Admin who manages this group
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tourist",
    required: true,
  },

  // Unique code for members to join
  accessCode: { type: String, required: true, unique: true },

  // Trip Duration
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // MASTER ITINERARY - Single Source of Truth
  // We utilize the Node-Based format to store minimal but rich data
  itinerary: [DayAppointSchema],

  // Members of the group
  members: [
    {
      touristId: { type: mongoose.Schema.Types.ObjectId, ref: "Tourist" },
      joinedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["active", "inactive", " SOS"],
        default: "active",
      },
      lastKnownLocation: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
  ],

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for geospatial queries on member locations (future proofing)
TourGroupSchema.index({ "members.lastKnownLocation": "2dsphere" });

module.exports = mongoose.model("TourGroup", TourGroupSchema);
