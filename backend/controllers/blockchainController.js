const { ethers } = require("ethers");
const { getJson } = require("ethers/lib/utils");
const { SosAlert } = require('../models/SOSalert');
const { SMART_CONTRACT_ADDRESS , PRIVATE_KEY , POLYGON_RPC_URL } = require('../config/config');

// The smart contract ABI from compilation
const contractABI = require('../../abi/SosContract.json'); 
const contractAddress = SMART_CONTRACT_ADDRESS;

// Initialize a provider and wallet
const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Create a contract instance
const sosContract = new ethers.Contract(contractAddress, contractABI, wallet);

// This function is called by the SOS controller
exports.logToBlockchain = async (alertId, digitalId) => {
  try {
    const alert = await SosAlert.findById(alertId);
    if (!alert) {
      console.error(`Alert with ID ${alertId} not found.`);
      return;
    }

    // Hash the alert data for immutable logging
    const alertHash = ethers.utils.solidityKeccak256(
      ['string', 'string', 'string', 'string'],
      [
        alert.digitalId,
        alert.timestamp.toISOString(),
        alert.location.latitude.toString(),
        alert.location.longitude.toString(),
      ]
    );

    const tx = await sosContract.logSosAlert(digitalId, alertHash, alert.timestamp.getTime());
    console.log(`Transaction submitted: ${tx.hash}`);

    // Wait for the transaction to be mined
    await tx.wait();

    // Update the database with the transaction hash
    alert.blockchainTxHash = tx.hash;
    alert.isLoggedOnChain = true;
    await alert.save();
    
    console.log(`SOS Alert ${alertId} successfully logged on-chain with hash: ${tx.hash}`);

  } catch (err) {
    console.error('Error logging to blockchain:', err);
    // Log this to a fallback DB for retry mechanisms
  }
};