const Tourist = require("../models/User.js");
const { sha256Hex } = require("../utils/hash.js");
const { hex64ToBytes32 } = require("../utils/ethFormat.js");
const { decrypt } = require("../utils/encrypt.js");
const blockchain = require("../services/blockchainService.js");

// Verify a tourist’s record against blockchain
exports.verifyTouristRecord = async (req, res) => {
  try {
    const { touristId } = req.params; // coming from route: /api/verify/:touristId
    const t = await Tourist.findOne({ touristId });
    if (!t) return res.status(404).json({ error: "Tourist not found" });

    // Recompute payload hash deterministically
    const storedGovHash = t.govIdHash;
    const itinerary = t.itineraryEncrypted ? decrypt(t.itineraryEncrypted) : "";
    const itineraryHash = sha256Hex(itinerary);

    const payload = `${t.touristId}|${storedGovHash}|${itineraryHash}|${t.audit.registeredAtIso}`;
    const payloadHash = sha256Hex(payload);

    // Use eventId and payloadHash stored in DB
    if (!t.audit?.eventId) {
      return res.status(400).json({ error: "No blockchain eventId found for this tourist" });
    }

    const ok = await blockchain.verifyAuditRecord(
      hex64ToBytes32(t.audit.eventId),
      hex64ToBytes32(payloadHash)
    );

    return res.json({
      verified: ok,
      touristId: t.touristId,
      payloadHash,
      blockchain: {
        eventId: t.audit.eventId,
        regTxHash: t.audit.regTxHash,
      },
    });
  } catch (err) {
    console.error("❌ verifyTouristRecord error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
