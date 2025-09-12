const { ethers } =require("ethers");
const {POLYGON_RPC,PRIVATE_KEY,SMART_CONTRACT_ADDRESS_reg } = require('../config/config')

const RPC_URL = POLYGON_RPC;
const CONTRACT_ADDRESS = SMART_CONTRACT_ADDRESS_reg;
const ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "eventId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "issuer",
				"type": "address"
			}
		],
		"name": "RecordStored",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "eventId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			}
		],
		"name": "storeEvent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "eventId",
				"type": "bytes32"
			}
		],
		"name": "getEvent",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "eventId",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "payloadHash",
				"type": "bytes32"
			}
		],
		"name": "verify",
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

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

/**
 * Store an audit record on blockchain
 * @param {string} eventIdBytes32 - 0x-prefixed 32-byte hex
 * @param {string} payloadHashBytes32 - 0x-prefixed 32-byte hex
 * @returns {string} txHash
 */
exports.storeEvent = async (eventIdBytes32, payloadHashBytes32) => {
  try {
    console.log("📌 Blockchain storeEvent input:", { eventIdBytes32, payloadHashBytes32 });

    const tx = await contract.storeEvent(eventIdBytes32, payloadHashBytes32);
    const receipt = await tx.wait();

	if(receipt.hash){
		console.log("✅ Tx mined:");
	}
    
    return receipt.hash;
  } catch (err) {
    console.error("❌ Blockchain tx failed:", err);
    throw err;
  }
};

/**
 * Verify a record on blockchain
 * @param {string} eventIdBytes32 - 0x-prefixed 32-byte hex
 * @param {string} payloadHashBytes32 - 0x-prefixed 32-byte hex
 * @returns {boolean}
 */
exports.verifyAuditRecord = async (eventIdBytes32, payloadHashBytes32) => {
  try {
    console.log("📌 Blockchain verify input:", { eventIdBytes32, payloadHashBytes32 });

    const ok = await contract.verify(eventIdBytes32, payloadHashBytes32);
    console.log("✅ Verify result:", ok);
    return ok;
  } catch (err) {
    console.error("❌ Blockchain verify failed:", err);
    throw err;
  }
};

/**
 * Fetch stored record from blockchain
 * @param {string} eventIdBytes32 - 0x-prefixed 32-byte hex
 * @returns {object} { payloadHash, timestamp, issuer }
 */
exports.getEvent = async (eventIdBytes32) => {
  try {
    const record = await contract.getEvent(eventIdBytes32);
    return {
      payloadHash: record[0],
      timestamp: Number(record[1]),
      issuer: record[2]
    };
  } catch (err) {
    console.error("❌ Blockchain getEvent failed:", err);
    throw err;
  }
};	

