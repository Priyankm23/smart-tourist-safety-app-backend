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
    // Include all fields required by the User model
    const {
      digitalId,
      username,
      firstName,
      lastName,
      email,
      password,
      country,
      photoUrl,
    } = req.body;

    // Validate presence of required fields to avoid Mongoose validation errors
    if (
      !digitalId ||
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !country
    ) {
      return next(new CustomError(400, 'Please enter all required fields.'));
    }

    // Check for duplicates by digitalId, username or email
    const existingUser = await User.findOne({
      $or: [{ digitalId }, { username }, { email }],
    });
    if (existingUser) {
      return next(
        new CustomError(
          400,
          'A user with the provided digitalId, username, or email already exists.'
        )
      );
    }

    const newUser = new User({
      digitalId,
      username,
      firstName,
      lastName,
      email,
      password,
      country,
      photoUrl,
    });

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