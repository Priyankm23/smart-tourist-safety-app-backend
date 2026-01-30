// const { ethers } = require("ethers");
// const ABI = [
// 	{
// 		"anonymous": false,
// 		"inputs": [
// 			{
// 				"indexed": true,
// 				"internalType": "bytes32",
// 				"name": "eventId",
// 				"type": "bytes32"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "bytes32",
// 				"name": "payloadHash",
// 				"type": "bytes32"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "uint256",
// 				"name": "timestamp",
// 				"type": "uint256"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "address",
// 				"name": "issuer",
// 				"type": "address"
// 			}
// 		],
// 		"name": "RecordStored",
// 		"type": "event"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "bytes32",
// 				"name": "eventId",
// 				"type": "bytes32"
// 			},
// 			{
// 				"internalType": "bytes32",
// 				"name": "payloadHash",
// 				"type": "bytes32"
// 			}
// 		],
// 		"name": "storeEvent",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "bytes32",
// 				"name": "eventId",
// 				"type": "bytes32"
// 			}
// 		],
// 		"name": "getEvent",
// 		"outputs": [
// 			{
// 				"internalType": "bytes32",
// 				"name": "",
// 				"type": "bytes32"
// 			},
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "",
// 				"type": "address"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "bytes32",
// 				"name": "eventId",
// 				"type": "bytes32"
// 			},
// 			{
// 				"internalType": "bytes32",
// 				"name": "payloadHash",
// 				"type": "bytes32"
// 			}
// 		],
// 		"name": "verify",
// 		"outputs": [
// 			{
// 				"internalType": "bool",
// 				"name": "",
// 				"type": "bool"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	}
// ]
// const {POLYGON_RPC,SMART_CONTRACT_ADDRESS} = require('./config/config')
// const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
// const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS, ABI, provider);

// async function inspectOnChain(eventIdHexNo0x) {
//   // ensure 0x prefix
//   const eventIdHex = eventIdHexNo0x.startsWith("0x") ? eventIdHexNo0x : "0x" + eventIdHexNo0x;
//   console.log("eventIdHex:", eventIdHex);

//   // call getEvent
//   const rec = await contract.getEvent(eventIdHex);
//   // rec[0] likely a bytes32 hex string (0x...)
//   console.log("on-chain payloadHash (raw):", rec[0]);
//   console.log("on-chain payloadHash (hex):", ethers.hexlify(rec[0]));
//   console.log("on-chain timestamp:", rec[1].toString());
//   console.log("on-chain issuer:", rec[2]);
// }

// inspectOnChain("a429333917e02b3bb370863b92f0fb361d24d5d70d80c514b03742f262dd5b56").catch(console.error);

// run in node with project context (you can make a quick script)
// const Tourist = require('./models/Tourist');
// const { sha256Hex } = require('./utils/hash');
// const connectDB = require('./config/dbConnection');

// async function checkLocal(touristId) {
//   const t = await Tourist.findOne({ touristId });
//   if (!t) throw new Error('tourist not found');

//   const itineraryRaw = JSON.stringify(t.dayWiseItinerary || "");
//   const itineraryHash = sha256Hex(itineraryRaw);
//   const payload = `${t.touristId}|${t.govIdHash}|${itineraryHash}|${t.audit.registeredAtIso}`;
//   const payloadHash = sha256Hex(payload);

//   console.log('itineraryRaw=', itineraryRaw);
//   console.log('computed payloadHash=', payloadHash);
//   console.log('db.regHash=', t.audit?.regHash);
//   return { payloadHash, dbRegHash: t.audit?.regHash, payload, itineraryHash };
// }
// Ensure DB is connected before running the check

// const Tourist = require('./models/Tourist');
// const connectDB = require('./config/dbConnection');
// // const { sha256Hex } = require('./utils/hash');

// // async function inspect(touristId) {
// //   const t = await Tourist.findOne({ touristId }).lean();
// //   if (!t) throw new Error('not found');

// //   const itineraryRaw = JSON.stringify(t.dayWiseItinerary || "");
// //   const itineraryHash = sha256Hex(itineraryRaw);
// //   const payload = `${t.touristId}|${t.govIdHash}|${itineraryHash}|${t.audit.registeredAtIso}`;
// //   const payloadHash = sha256Hex(payload);

// //   console.log('db.govIdHash:', t.govIdHash);
// //   console.log('db.dayWiseItineraryHash (stored):', t.audit?.dayWiseItineraryHash);
// //   console.log('recomputed itineraryHash:', itineraryHash);
// //   console.log('db.registeredAtIso:', t.audit?.registeredAtIso);
// //   console.log('recomputed payload:', payload);
// //   console.log('recomputed payloadHash:', payloadHash);
// //   console.log('db.regHash:', t.audit?.regHash);
// // }

// // const Tourist = require('./models/Tourist');
// const { sha256Hex } = require('./utils/hash');
// const { decrypt } = require('./utils/encrypt');

// async function findMatch(touristId) {
//   const t = await Tourist.findOne({ touristId }).lean();
//   if (!t) throw new Error('tourist not found');

//   const gov = t.govIdHash;
//   const ts = t.audit?.registeredAtIso;
//   const dbReg = t.audit?.regHash;
//   console.log('dbRegHash:', dbReg);

//   const candidates = [];

//   // 1) empty itinerary (sha256 of "")
//   candidates.push({
//     name: 'emptyString',
//     itineraryHash: sha256Hex(""),
//   });

//   // 2) dayWiseItinerary serialized exactly as JSON.stringify(...)
//   const dayRaw = JSON.stringify(t.dayWiseItinerary || "");
//   candidates.push({
//     name: 'dayWiseItinerary_stringified',
//     itineraryHash: sha256Hex(dayRaw),
//     raw: dayRaw
//   });

//   // 3) decrypted itineraryEncrypted (if present)
//   if (t.itineraryEncrypted) {
//     const dec = decrypt(t.itineraryEncrypted);
//     const decStr = typeof dec === 'string' ? dec : JSON.stringify(dec);
//     candidates.push({
//       name: 'itineraryEncrypted_decrypted',
//       itineraryHash: sha256Hex(decStr),
//       raw: decStr
//     });
//   }

//   // 4) audit.dayWiseItineraryHash if stored
//   if (t.audit && t.audit.dayWiseItineraryHash) {
//     candidates.push({
//       name: 'audit.dayWiseItineraryHash',
//       itineraryHash: t.audit.dayWiseItineraryHash
//     });
//   }

//   // Evaluate payloadHash for each candidate
//   for (const c of candidates) {
//     const payload = `${t.touristId}|${gov}|${c.itineraryHash}|${ts}`;
//     const payloadHash = sha256Hex(payload);
//     console.log('---');
//     console.log('candidate:', c.name);
//     if (c.raw) console.log('rawSample:', c.raw.slice(0,200));
//     console.log('itineraryHash:', c.itineraryHash);
//     console.log('payloadHash:', payloadHash, ' matchesDB?', payloadHash === dbReg);
//   }
// }

// // (async () => {
// //   try {
// //     await connectDB();
// //     await findMatch('T1769345233706').catch(err => { console.error(err); process.exit(1); });
// //     process.exit(0);
// //   } catch (err) {
// //     console.error(err);
// //     process.exit(1);
// //   }
// // })();

// // node scripts/checkOnChain.js
// const { ethers } = require('ethers');
// // const Tourist = require('../models/Tourist');
// // const connectDB = require('../config/dbConnection');
// const { POLYGON_RPC, SMART_CONTRACT_ADDRESS_reg } = require('./config/config');

// const ABI = [
//   'function getEvent(bytes32) view returns (bytes32,uint256,address)'
// ];

// (async () => {
//   await connectDB();
//   const t = await Tourist.findOne({ touristId: 'T1769345233706' }).lean();
//   if (!t) return console.error('tourist not found');

//   const eventIdHex = t.audit?.eventId ? (t.audit.eventId.startsWith('0x') ? t.audit.eventId : '0x'+t.audit.eventId) : null;
//   console.log('DB regHash:', t.audit?.regHash);
//   console.log('DB eventId:', t.audit?.eventId);
//   console.log('DB regTxHash:', t.audit?.regTxHash);

//   const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
//   const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS_reg, ABI, provider);

//   if (eventIdHex) {
//     try {
//       // Call by fully-qualified signature to avoid library helper name collisions
//       const ev = await contract["getEvent(bytes32)"](eventIdHex);
//       // ev is an array-like result: [payloadHash, timestamp, issuer]
//       console.log('onChain payloadHash:', ev[0]);
//       console.log('onChain timestamp:', ev[1].toString());
//       console.log('onChain issuer:', ev[2]);
//     } catch (e) {
//       console.error('getEvent error', e);
//     }
//   } else {
//     console.log('No eventId in DB to query on-chain');
//   }

//   if (t.audit?.regTxHash) {
//     try {
//       const receipt = await provider.getTransactionReceipt(t.audit.regTxHash);
//       console.log('tx receipt status:', receipt?.status);
//       console.log('tx logs length:', receipt?.logs?.length);
//     } catch (e) {
//       console.error('getTransactionReceipt error', e);
//     }
//   }
//   process.exit(0);
// })();



// authority-test.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: true, // Allow all origins dynamically
    credentials: true,
  }),
);

const io = new Server(server, {
  path: '/realtime/socket.io',           // must match client
  cors: { origin: ['http://localhost:5173'] } // set to your frontend origin
});

io.on('connection', socket => {
  console.log('connected', socket.id);

  socket.on('register', role => {
    socket.join(role); // e.g. 'authorityDashboard' or 'touristApp'
    console.log(role)
  });

  socket.on('triggerSOS', data => {
    // broadcast only to authorities
    io.to('authorityDashboard').emit('newSOS', data);
  });
});

server.listen(5000, () => console.log('server listening on 5000'));