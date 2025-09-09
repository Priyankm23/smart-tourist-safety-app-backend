const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// A simple controller-like function to handle verification
const verifyTransactionStatus = async (req, res, next) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({ message: 'Transaction hash is required.' });
    }

    // Get a provider from your blockchain service
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

    // Fetch the transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt) {
      if (receipt.status === 1) {
        res.status(200).json({
          status: 'success',
          message: 'Transaction successfully confirmed on the blockchain.',
          blockNumber: receipt.blockNumber,
        });
      } else {
        res.status(200).json({
          status: 'reverted',
          message: 'Transaction failed or was reverted.',
        });
      }
    } else {
      res.status(404).json({
        status: 'pending',
        message: 'Transaction not found or is still pending confirmation.',
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Verify the status of a blockchain transaction
// @route   GET /api/blockchain/verify/:txHash
// @access  Public
router.get('/verify/:txHash', verifyTransactionStatus);

module.exports = router;