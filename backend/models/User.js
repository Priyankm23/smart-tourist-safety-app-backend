const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // A library to hash passwords

const userSchema = new mongoose.Schema({
  // Personal & Temporary Trip Details
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  country: { type: String, required: true },
  photoUrl: {
    type: String,
    // This will store the Cloudinary URL for the user's photo.
  },
  
  // Temporary Tourist ID for the duration of the trip
  touristId: {
    type: String,
    unique: true,
    sparse: true, // Allows for some documents to not have this field
    // This ID is generated upon trip start and removed upon trip end.
  },

  // Blockchain-backed Digital ID (Immutable & Public)
  digitalId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    index: true,
  },

  // Location & Status
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date },
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['tourist'], default: 'tourist' },
  createdAt: { type: Date, default: Date.now },
});

// Mongoose Pre-Save Hook for Password Hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);