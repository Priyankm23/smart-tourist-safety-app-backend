const { ethers } = require("ethers");
const { POLYGON_RPC,SMART_CONTRACT_ADDRESS,PRIVATE_KEY} = require('./config/config');
const contractABI = [
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

const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS, contractABI, wallet);

async function storeAuditRecord(eventIdBytes32, payloadHashBytes32) {
  try {
    console.log("📌 Storing record on-chain...");
    console.log("eventId:", eventIdBytes32);
    console.log("payload:", payloadHashBytes32);

    console.log(eventIdBytes32.length); // should be 66
    console.log(payloadHashBytes32.length);

    const tx = await contract.storeAuditRecord(eventIdBytes32, payloadHashBytes32);
    console.log("TX sent:", tx);

    const receipt = await tx.wait();
    console.log("TX mined:", receipt);

    // Ethers v6 fix
    return receipt.hash || receipt.transactionHash;
  } catch (err) {
    console.error("❌ Blockchain tx failed:", err);
    return "failed-tx";
  }
}

module.exports = { storeAuditRecord };
