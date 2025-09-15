const jwt = require("jsonwebtoken");
const Tourist = require("../models/Tourist.js");
const bcrypt = require("bcryptjs");
const { encrypt } = require("../utils/encrypt.js");
const { sha256Hex } = require("../utils/hash.js");
const { hex64ToBytes32 } = require("../utils/ethFormat.js");
const blockchain = require("../services/blockchainService.js");

const { JWT_SECRET , JWT_EXPIRES_IN} = require("../config/config")

exports.registerTourist = async (req, res) => {
  try {
    const { name, govId, phone, email, dayWiseItinerary, tripMembers,  emergencyContact, password, language, tripEndDate } = req.body;
    const { consent } = req.body;

    // Basic validation
    if (!name || !govId || !phone || !emergencyContact || !password || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingTourist=await Tourist.findOne({email})

        if(existingTourist){
            const error=new Error('tourist already exists')
            error.statusCode=409
            throw error
        }

    // Generate internal touristId
    const touristId = "T" + Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 999);

    // Encrypt sensitive fields
    const nameEnc = encrypt(name);
    const phoneEnc = encrypt(phone);
    const dayWiseItineraryEnc = dayWiseItinerary
      ? encrypt(JSON.stringify(dayWiseItinerary))
      : null;
    const tripMembersEnc = tripMembers
      ? encrypt(JSON.stringify(tripMembers))
      : null;
    const emergencyEnc = encrypt(JSON.stringify(emergencyContact));

    // Password hashing
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Government ID hash
    const govSalt = process.env.GOVID_SALT || "static-salt-for-dev";
    const govIdHash = sha256Hex(govId + govSalt);

    // Deterministic fields for blockchain/audit
    const registeredAtIso = new Date().toISOString();
    const dayWiseItineraryHash = sha256Hex(JSON.stringify(dayWiseItinerary || ""));
    const payload = `${touristId}|${govIdHash}|${dayWiseItineraryHash}|${registeredAtIso}`;
    const payloadHash = sha256Hex(payload);

    // Create Tourist record
    const tourist = new Tourist({
      touristId,
      nameEncrypted: nameEnc,
      govIdHash,
      phoneEncrypted: phoneEnc,
      email, // plain email for login
      dayWiseItineraryEncrypted: dayWiseItineraryEnc,
      tripMembersEncrypted: tripMembersEnc,
      emergencyContactEncrypted: emergencyEnc,
      passwordHash,
      language: language || "en",
      safetyScore: 100,
      consent: {
        tracking: consent?.tracking || false,
        dataRetention: consent?.dataRetention || false,
        emergencySharing: consent?.emergencySharing || false
      },
      createdAt: new Date(),
      expiresAt: tripEndDate ? new Date(tripEndDate) : null,
    });

    await tourist.save();

    // Blockchain push
    const { v4: uuidv4 } = require("uuid");
    const eventIdRaw = uuidv4() + "|" + touristId;
    const eventIdHash = sha256Hex(eventIdRaw);
    const eventIdBytes32 = hex64ToBytes32(eventIdHash);
    const payloadHashBytes32 = hex64ToBytes32(payloadHash);

    let txHash;
    try {
      txHash = await blockchain.storeEvent(eventIdBytes32, payloadHashBytes32); // match contract function name
      if(txHash){
        console.log("transaction hash returned correctly");
      }
     
    } catch (err) {
      console.error("Blockchain tx failed:", err);
      txHash = null;
    }

    tourist.audit = {
      regHash: payloadHash,
      regTxHash: txHash || "not-recorded",
      eventId: eventIdHash,
      dayWiseItineraryHash: dayWiseItineraryHash,
      registeredAtIso: registeredAtIso
    };

    await tourist.save();

    return res.status(201).json({
      touristId,
      message: "Registered. Digital ID created.",
      audit: {
        regHash: payloadHash,
        regTxHash: txHash,
        eventId: eventIdHash
      }
    });

  } catch (err) {
    console.error("registerTourist error", err);
     if (err.statusCode && err.message) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.loginTourist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find tourist by email
    const tourist = await Tourist.findOne({ email: email });
    if (!tourist) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, tourist.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Generate JWT
    const payload = {
      touristId: tourist.touristId,
      language: tourist.language
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.status(200).json({
      message: "Login successful",
      touristId: tourist.touristId,
      token
    });

  } catch (err) {
    console.error("loginTourist error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};