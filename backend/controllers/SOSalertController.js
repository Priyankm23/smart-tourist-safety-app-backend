const SOSAlert = require("../models/SOSalert.js");
const { ethers } = require("ethers");
const { sha256Hex } = require("../utils/hash.js"); // your existing hash utility
const { POLYGON_RPC, PRIVATE_KEY, SMART_CONTRACT_ADDRESS_sos } = require("../config/config.js");
const Tourist = require('../models/User.js');
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
    const { touristId, location, safetyScore, locationName, sosReason } = req.body;

    // 1. Get tourist details
    const tourist = await Tourist.findOne({ _id: touristId });
    if (!tourist) {
      return res.status(404).json({ error: "Tourist not found" });
    }

    // 2. Decrypt emergency contact
    let emergencyContact = null;
    
    if (tourist.emergencyContactEncrypted) {
      const decrypted = JSON.parse(decrypt(tourist.emergencyContactEncrypted));
      console.log("🔍 Decrypted emergency contact:", decrypted);
    
      emergencyContact = decrypted;
    }
    console.log(emergencyContact);
        
    const sosAlert = new SOSAlert({
      touristId,
      location,
      safetyScore,
      locationName,
      sosReason,
      emergencyContact,   // now the right shape
      status: "new",
    });
        
    await sosAlert.save();
	console.log(sosAlert);

    // 2️⃣ Compute payload hash for blockchain (using bytes32)
    const payloadString = `${sosAlert._id}|${touristId}|${location.coordinates.join(",")}|${sosReason.reason}|${sosAlert.timestamp.toISOString()}`;
    const payloadHash = ethers.id(payloadString); // keccak256

    const alertId = ethers.id(sosAlert._id.toString());

    console.log("📌 Logging SOS alert on-chain...");
    console.log("Alert ID:", alertId);
    console.log("Payload Hash:", payloadHash);

    // 3️⃣ Send transaction to blockchain
    const tx = await contract.logAlert(alertId, payloadHash);
    console.log("⏳ Transaction sent. Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Alert logged on-chain!", receipt.hash);

    // 4️⃣ Update MongoDB with blockchain info
    sosAlert.blockchainTxHash = receipt.hash;
    sosAlert.isLoggedOnChain = true;
    sosAlert.alertIdOnChain = alertId;
    sosAlert.payloadHashOnChain = payloadHash;

    await sosAlert.save();

    // 5️⃣ Respond to client
    return res.json({
      success: true,
      message: "SOS alert triggered successfully",
      sosAlert: {
        id: sosAlert._id,
        status: sosAlert.status,
        location: sosAlert.location,
        timestamp: sosAlert.timestamp,
        blockchainTxHash: sosAlert.blockchainTxHash
      }
    });

  } catch (err) {
    console.error("❌ triggerSOS error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
