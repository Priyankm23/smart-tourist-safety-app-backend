const Tourist = require("../models/Tourist.js");
const { sha256Hex } = require("../utils/hash.js");
const { hex64ToBytes32 } = require("../utils/ethFormat.js");
const { decrypt } = require("../utils/encrypt.js");
const blockchain = require("../services/blockchainService.js");

// Verify a tourist’s record against blockchain
exports.verifyTouristRecord = async (req, res, next) => {
  try {
    const { touristId } = req.params; // coming from route: /api/verify/:touristId
    const t = await Tourist.findOne({ touristId });
    if (!t) return res.status(404).json({ error: "Tourist not found" });

    // Recompute payload hash deterministically
    const storedGovHash = t.govIdHash;
    // Use the itinerary hash that was recorded at registration if available.
    // At registration we stored `dayWiseItineraryHash = sha256Hex(JSON.stringify(dayWiseItinerary || ""))`.
    const itineraryHash = t.audit?.dayWiseItineraryHash
      ? t.audit.dayWiseItineraryHash
      : sha256Hex(JSON.stringify(t.dayWiseItinerary || ""));
    const itineraryRaw = t.audit?.dayWiseItineraryHash ? '(used audit.dayWiseItineraryHash)' : JSON.stringify(t.dayWiseItinerary || "");

    const payload = `${t.touristId}|${storedGovHash}|${itineraryHash}|${t.audit.registeredAtIso}`;
    const payloadHash = sha256Hex(payload);

    // Debug logs to help diagnose verification mismatches
    console.log('verify: touristId=', t.touristId);
    console.log('verify: storedGovHash=', storedGovHash);
    console.log('verify: itineraryRaw=', itineraryRaw);
    console.log('verify: itineraryHash=', itineraryHash);
    // Canonical comparisons (normalize hex case and 0x)
    const normalize = (h) => (h ? (h.startsWith('0x') ? h.toLowerCase() : '0x' + h.toLowerCase()) : h);
    console.log('verify: payloadHash (normalized)=', normalize(payloadHash));
    console.log('verify: db.regHash (normalized)=', normalize(t.audit?.regHash));
    console.log('verify: equal to db?', normalize(payloadHash) === normalize(t.audit?.regHash));
    console.log('verify: payload=', payload);
    console.log('verify: payloadHash=', payloadHash);
    console.log('verify: db.regHash=', t.audit?.regHash, ' db.eventId=', t.audit?.eventId, ' db.regTxHash=', t.audit?.regTxHash);
    try {
      console.log('verify: eventId32=', hex64ToBytes32(t.audit.eventId));
      console.log('verify: payloadHash32=', hex64ToBytes32(payloadHash));
    } catch (e) {
      console.error('verify: hex64ToBytes32 conversion error', e);
    }

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
    next(err);
  }
};
