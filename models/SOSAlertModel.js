const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    // Reference to the tourist who triggered the SOS
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tourist",
      required: true,
    },

    // Current status of the alert
    status: {
      type: String,
      enum: ["new", "acknowledged", "responding", "resolved", "closed"],
      default: "new",
    },

    // GeoJSON format for live location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: "2dsphere",
      },
      locationName: { type: String }, // optional descriptive name
    },

    // Timestamp when SOS was triggered
    timestamp: { type: Date, default: Date.now },

    // Safety score (can be computed from backend or device)
    safetyScore: { type: Number, min: 0, max: 100 },

    // Emergency contacts (array to support multiple contacts)
    emergencyContact: {
      name: String,
      phone: String,
    },

    // SOS reason and additional metadata
    sosReason: {
      reason: { type: String },
    },

    // Blockchain logging fields
    blockchainTxHash: { type: String },
    isLoggedOnChain: { type: Boolean, default: false },
    alertIdOnChain: { type: String }, // bytes32 alertId for blockchain reference
    payloadHashOnChain: { type: String }, // hash of the payload stored on-chain

    // Authorities/Units assigned to handle the SOS
    // Store assigned unit's name and contact number
    assignedTo: [{
      authorityId: { type: String }, // The handler's ID (authority)
      authorityName: { type: String }, // The handler's Name
      unitName: { type: String }, // Name of the dispatched unit (e.g. Unit 4)
      role: { type: String },
      phoneNo: { type: String }      // Contact number of the unit
    }],

    // Response time formatted string (e.g., "00:57:54") sent by frontend
    responseTime: { type: String },

    // ETA details for tourist acknowledgement and live countdown
    etaMinutes: { type: Number, min: 0 },
    etaArrivalAt: { type: Date },
    etaUpdatedAt: { type: Date },
    etaUpdatedBy: { type: String },

    // Auditable timestamps
    responseDate: { type: Date }, // Time when authority was assigned
    resolvedDate: { type: Date }, // Time when alert was marked resolved

    // Additional metadata
    metadata: { type: Object },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  },
);

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
