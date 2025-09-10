const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const Authority = require('../models/Authority'); 
const { CustomError } = require('../middlewares/errorMiddleware');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

// Import the blockchain service
const { registerIDOnBlockchain } = require('../services/blockchainService');

// @desc    Register a new user (tourist)
// @route   POST /api/auth/register/tourist
exports.registerTourist = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, country, phoneNumber, digitalId, photoUrl } = req.body;
    
    // Check for all required fields based on the schema
    if (!username || !email || !password || !firstName || !lastName || !country || !phoneNumber || !digitalId) {
      throw new CustomError(400, 'Please enter all required fields.');
    }

    // Step 1: Check if the digital ID is already registered on the blockchain
    const isRegisteredOnChain = await registerIDOnBlockchain(digitalId);
    if (isRegisteredOnChain) {
      throw new CustomError(400, 'Digital ID already registered on-chain.');
    }

    // Step 2: Save user PII to the database. Do NOT save the digitalId directly.
    const newUser = new User({ 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      country, 
      phoneNumber,
      photoUrl 
    });
    
    // Check if a user with the same username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new CustomError(400, 'Username or email already in use.');
    }

    await newUser.save();

    // Step 3: Register the digital ID on the blockchain and get the transaction hash
    // We pass the blockchain-registered digitalId to the blockchain service
    const blockchainTx = await registerIDOnBlockchain(digitalId);

    // Save the blockchain transaction hash to the database for audit trail.
    await User.findByIdAndUpdate(newUser._id, { 'blockchainTxHash': blockchainTx.hash });

    res.status(201).json({ 
      message: 'Tourist registered successfully.',
      blockchainTxHash: blockchainTx.hash
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Login a user (tourist or authority)
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      throw new CustomError(400, 'Please provide email, password, and role.');
    }

    let foundUser;
    if (role === 'tourist') {
      foundUser = await User.findOne({ email });
    } else if (role === 'authority') {
      foundUser = await Authority.findOne({ email });
    } else {
      throw new CustomError(400, 'Invalid role.');
    }

    if (!foundUser) {
      throw new CustomError(401, 'Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      throw new CustomError(401, 'Invalid credentials.');
    }

    const payload = { 
      id: foundUser._id,
      role: foundUser.role,
      // The digitalId is not in the DB, so we don't include it here
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};