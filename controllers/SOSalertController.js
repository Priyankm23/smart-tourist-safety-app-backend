const SOSAlert = require("../models/SOSalert.js");
const { ethers } = require("ethers");
const { hex64ToBytes32 } = require('../utils/ethFormat.js');
const { sha256Hex } = require("../utils/hash.js"); // your existing hash utility
const { POLYGON_RPC, PRIVATE_KEY, SMART_CONTRACT_ADDRESS_sos } = require("../config/config.js");
const Tourist = require('../models/Tourist.js');
const { decrypt } = require('../utils/encrypt.js');
const SOSABI =  [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "alertId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "tourist",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "AlertLogged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "alertId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			}
		],
		"name": "logAlert",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "alertId",
				"type": "bytes32"
			}
		],
		"name": "getAlert",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "tourist",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "alertId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "payloadHashHash",
				"type": "bytes32"
			}
		],
		"name": "verifyAlert",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

// Initialize provider & contract
const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS_sos, SOSABI, wallet);

/**
 * Trigger SOS alert
 * @param req.body: {
 *   touristId, 
 *   location: { coordinates: [lng, lat], locationName }, 
 *   safetyScore,
 *   emergencyContacts: [{name, phone, email}],
 *   sosReason: { reason, weatherInfo, extra }
 * }
 */
exports.triggerSOS = async (req, res) => {
  try {
    const { location, safetyScore, locationName, sosReason } = req.body;
    const touristId = req.user.touristId;

    // 1️⃣ Get tourist details
    const tourist = await Tourist.findOne({ touristId });
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    // 2️⃣ Decrypt emergency contact
    let emergencyContact = null;
    if (tourist.emergencyContactEncrypted) {
      emergencyContact = JSON.parse(decrypt(tourist.emergencyContactEncrypted));
    }

    // 3️⃣ Save SOS in MongoDB immediately
    const sosAlert = new SOSAlert({
      touristId: tourist._id,
      location,
      safetyScore,
      locationName,
      sosReason,
      emergencyContact,
      status: "new",
    });
    await sosAlert.save();

    // 4️⃣ Respond to authority / client immediately
    res.json({
      success: true,
      message: "SOS alert received. Authorities have been notified.",
      sosAlert: {
        id: sosAlert._id,
        status: sosAlert.status,
        location: sosAlert.location,
        timestamp: sosAlert.timestamp,
      },
    });

    // 5️⃣ AFTER response: log alert on blockchain asynchronously
    (async () => {
      try {
        const { v4: uuidv4 } = require("uuid");
        const eventIdRaw = uuidv4() + "|" + sosAlert._id.toString();
        const eventIdHash = sha256Hex(eventIdRaw);
        const alertId = hex64ToBytes32(eventIdHash);

        const payloadString = `${sosAlert._id}|${touristId}|${location.coordinates.join(",")}|${sosReason.reason}|${sosAlert.timestamp.toISOString()}`;
        const payloadHash = ethers.id(payloadString);

        console.log("📌 Logging SOS alert on-chain...");
        const tx = await contract.logAlert(alertId, payloadHash);
        const receipt = await tx.wait();

        // Update MongoDB with blockchain info
        sosAlert.blockchainTxHash = receipt.hash;
        sosAlert.isLoggedOnChain = true;
        sosAlert.alertIdOnChain = alertId;
        sosAlert.payloadHashOnChain = payloadHash;
        await sosAlert.save();

        console.log("✅ SOS logged on-chain:", receipt.hash);
      } catch (err) {
        console.error("❌ Blockchain logging error:", err);
      }
    })();

  } catch (err) {
    console.error("❌ triggerSOS error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
