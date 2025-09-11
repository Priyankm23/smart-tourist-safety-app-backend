const { ethers } = require("ethers");
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
const {POLYGON_RPC,SMART_CONTRACT_ADDRESS} = require('./config/config')
const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS, ABI, provider);

async function inspectOnChain(eventIdHexNo0x) {
  // ensure 0x prefix
  const eventIdHex = eventIdHexNo0x.startsWith("0x") ? eventIdHexNo0x : "0x" + eventIdHexNo0x;
  console.log("eventIdHex:", eventIdHex);

  // call getEvent
  const rec = await contract.getEvent(eventIdHex);
  // rec[0] likely a bytes32 hex string (0x...)
  console.log("on-chain payloadHash (raw):", rec[0]);
  console.log("on-chain payloadHash (hex):", ethers.hexlify(rec[0]));
  console.log("on-chain timestamp:", rec[1].toString());
  console.log("on-chain issuer:", rec[2]);
}

inspectOnChain("a429333917e02b3bb370863b92f0fb361d24d5d70d80c514b03742f262dd5b56").catch(console.error);
