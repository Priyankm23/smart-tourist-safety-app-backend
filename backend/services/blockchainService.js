const { ethers } = require('ethers');
const config = require('../config/config'); // Assuming a config file for environment variables

// Replace with your actual contract ABI and address
const contractABI = [
  // A simplified ABI with just the logAlert function
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "alertId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "dataHash",
        "type": "string"
      }
    ],
    "name": "logAlert",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];
const contractAddress = process.env.CONTRACT_ADDRESS; // Your deployed contract address

// Connect to the Polygon RPC URL
const provider = new ethers.providers.JsonRpcProvider(config.polygonRpcUrl);

// Create a wallet instance from the private key
const wallet = new ethers.Wallet(config.authorityPrivateKey, provider);

// Create a contract instance
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

/**
 * Logs an alert to the blockchain.
 * @param {string} alertId The unique ID of the alert.
 * @param {object} alertData The data to be logged, including timestamp and location.
 * @returns {Promise<object>} The transaction receipt.
 */
exports.logAlertToBlockchain = async (alertId, alertData) => {
  try {
    console.log(`Logging alert ${alertId} to blockchain...`);

    // Prepare the data to be hashed
    const dataToHash = JSON.stringify(alertData);
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataToHash));

    // Call the smart contract's logAlert function
    const tx = await contract.logAlert(
      alertId,
      alertData.timestamp,
      alertData.location,
      dataHash
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log(`Transaction successful with hash: ${receipt.transactionHash}`);

    return receipt;
  } catch (error) {
    console.error("Failed to log alert to blockchain:", error);
    throw new Error('Blockchain logging failed.');
  }
};