const mongoose = require("mongoose");

const RawInfoSchema = new mongoose.Schema({
  Name: String,
  Category: String,
  Sub_Category: String,
  State: String,
  Latitude: String,
  Longitude: String,
  Area_km2: String,
  Year_Established: String,
  Source: String,
  Additional_Info: String,
}, { _id: false });

const DangerZoneSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true}, // "disaster-0"
  name: { type: String, required: true },                 // "Andhra Pradesh Coast"
  type: { type: String, enum: ["circle", "polygon"], required: true }, 
  coords: {                                               // [lat, lng]
    type: [Number],
    required: true,
    validate: {
      validator: arr => arr.length === 2,
      message: "Coords must be [latitude, longitude]"
    }
  },
  radiusKm: { type: Number },                             // optional (only for circle)
  category: { type: String },
  state: { type: String },
  riskLevel: { type: String, enum: ["Low", "Medium", "High", "Very High"] },
  source: { type: String },
  raw: { type: RawInfoSchema },                           // keep original raw metadata
}, { timestamps: true });

module.exports = mongoose.model("DangerZone", DangerZoneSchema);
