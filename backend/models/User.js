// backend/models/Tourist.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const TouristSchema = new mongoose.Schema({
  touristId: { type: String, required: true, unique: true }, // internal id like T1001
  nameEncrypted: { type: String, required: true },           // AES encrypted
  govIdHash: { type: String, required: true },               // SHA256 hash of Aadhaar/passport
  phoneEncrypted: { type: String, required: true },          // AES encrypted
  emailEncrypted: { type: String },                          // AES encrypted
  emailForLogin: { type: String, required: true, unique: true },
  itineraryEncrypted: { type: String },                      // AES encrypted
  emergencyContactEncrypted: { type: String },               // AES encrypted
  passwordHash: { type: String, required: true },            // bcrypt hashed password
  language: { type: String, default: "en" },
  safetyScore: { type: Number, default: 100 },               // initial tourist safety score
  consent: {
    tracking: { type: Boolean, default: false },
    dataRetention: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },       // end of trip
  audit: {
    regHash: { type: String },     // SHA256 hash that was written to blockchain
    regTxHash: { type: String }    // blockchain tx hash
  }
});


module.exports = mongoose.model("Tourist", TouristSchema);
