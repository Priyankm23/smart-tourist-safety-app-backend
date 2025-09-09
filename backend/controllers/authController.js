const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const Authority = require('../models/Authority'); 
const { CustomError } = require('../middlewares/errorMiddleware');
const {JWT_SECRET,JWT_EXPIRES_IN} = require('../config/config');

// @desc    Register a new user (tourist)
// @route   POST /api/auth/register/tourist
exports.registerTourist = async (req, res, next) => {
  try {
    const { digitalId, firstName, lastName, email, password } = req.body;
    if (!digitalId || !firstName || !email || !password) {
      return next(new CustomError(400, 'Please enter all fields.'));
    }

    const existingUser = await User.findOne({ digitalId });
    if (existingUser) {
      return next(new CustomError(400, 'Digital ID already registered.'));
    }

    const newUser = new User({ digitalId, firstName, lastName, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Tourist registered successfully.' });
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
      return next(new CustomError(400, 'Please enter all fields.'));
    }

    let foundUser;
    if (role === 'tourist') {
      foundUser = await User.findOne({ email });
    } else if (role === 'authority') {
      foundUser = await Authority.findOne({ email });
    } else {
      return next(new CustomError(400, 'Invalid role.'));
    }

    if (!foundUser) {
      return next(new CustomError(401, 'Invalid credentials.'));
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return next(new CustomError(401, 'Invalid credentials.'));
    }

    const payload = { 
      id: foundUser._id,
      role: foundUser.role,
      digitalId: foundUser.digitalId
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};