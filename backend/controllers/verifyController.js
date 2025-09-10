const Tourist = require("../models/Tourist.js");
const { sha256Hex } = require("../utils/hash.js");
const { hex64ToBytes32 } = require("../utils/ethFormat.js");
const blockchain = require("../blockchain/blockchainService.js");
const { decrypt } = require("../utils/encrypt.js");

exports.verifyTouristRecord=async(req, res)=> {
  try {
    const { touristId, eventIdHex } = req.params; // eventIdHex: 0x...
    const t = await Tourist.findOne({ touristId });
    if (!t) return res.status(404).json({ error: "not found" });

    // Recompute payloadHash deterministically
    const storedGovHash = t.govIdHash;
    const itineraryHash = t.itineraryEncrypted ? sha256Hex(decrypt(t.itineraryEncrypted)) : sha256Hex("");
    const payload = `${t.touristId}|${storedGovHash}|${itineraryHash}|${t.createdAt.toISOString()}`;
    const payloadHash = sha256Hex(payload);

    const ok = await blockchain.verifyAuditRecord(eventIdHex, hex64ToBytes32(payloadHash));
    return res.json({ verified: ok, payloadHash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
