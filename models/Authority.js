// models/Authority.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const authoritySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hashed
  fullName: { type: String, required: true },
  policeStationId: { type: String, required: true }, // simple string, can later be ObjectId ref
  role: {
    type: String,
    enum: ["Police Officer", "Tourism Officer", "Emergency Responder", "Admin"],
    required: true
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before save
authoritySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
authoritySchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Authority", authoritySchema);
