const jwt = require("jsonwebtoken");
const Tourist = require("../models/User.js");
const bcrypt = require("bcryptjs");
const { encrypt } = require("../utils/encrypt.js");
const { sha256Hex } = require("../utils/hash.js");
const { hex64ToBytes32 } = require("../utils/ethFormat.js");
const blockchain = require("../services/blockchainService.js");
const { v4: uuidv4 } = require("uuid");

exports.registerTourist=async(req, res)=> {
  try {
    const { name, govId, phone, email, itinerary, emergencyContact,password, language, tripEndDate } = req.body;

    // basic validation
    if (!name || !govId || !phone || !emergencyContact || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate internal touristId
    const touristId = "T" + Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 999);

    // Encrypt sensitive fields
    const nameEnc = encrypt(name);
    const phoneEnc = encrypt(phone);
    const emailEnc = email ? encrypt(email) : null;
    const itineraryEnc = itinerary ? encrypt(JSON.stringify(itinerary)) : null;
    const emergencyEnc = encrypt(JSON.stringify(emergencyContact));

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    // Create a one-way hash of government id (salted)
    const govSalt = process.env.GOVID_SALT || "static-salt-for-dev"; // in production use per-record random salt stored encrypted or KMS
    const govIdHash = sha256Hex(govId + govSalt);

    // Build payload for on-chain audit (string concatenation in deterministic order)
    const payload = `${touristId}|${govIdHash}|${sha256Hex(JSON.stringify(itinerary || ""))}|${new Date().toISOString()}`;
    const payloadHash = sha256Hex(payload); // 64-char hex

    // Save in DB
    const tourist = new Tourist({
      touristId,
      nameEncrypted: nameEnc,
      govIdHash,
      phoneEncrypted: phoneEnc,
      emailEncrypted: emailEnc,
      emailForLogin: email, 
      itineraryEncrypted: itineraryEnc,
      emergencyContactEncrypted: emergencyEnc,
      passwordHash,  
      language: language || "en",
      safetyScore: 100,
      consent: { tracking: false, dataRetention: true },
      createdAt: new Date(),
      expiresAt: tripEndDate ? new Date(tripEndDate) : null,
      audit: { regHash: payloadHash }
    });

    await tourist.save();

    // Push to blockchain (store event)
    // Create an eventId (use uuid + touristId) then convert to bytes32 via sha256
    const eventIdRaw = uuidv4() + "|" + touristId;
    const eventIdHash = sha256Hex(eventIdRaw);
    const eventIdBytes32 = hex64ToBytes32(eventIdHash);
    const payloadHashBytes32 = hex64ToBytes32(payloadHash);

    let txHash;
    try {
      txHash = await blockchain.storeAuditRecord(eventIdBytes32, payloadHashBytes32);
    } catch (err) {
      console.error("Blockchain tx failed:", err);
      txHash = null; // or keep undefined
    }

    tourist.audit.regTxHash = txHash || "not-recorded";
    await tourist.save();

    return res.status(201).json({
      touristId,
      message: "Registered. Digital ID created.",
      audit: {
        regHash: payloadHash,
        regTxHash: txHash,
        eventId: eventIdHash,
      },
    });
  } catch (err) {
    console.error("registerTourist error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

exports.loginTourist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find tourist by email
    const tourist = await Tourist.findOne({ emailForLogin: email });
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

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
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