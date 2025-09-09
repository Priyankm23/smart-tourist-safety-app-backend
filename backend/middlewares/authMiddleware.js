const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed
const Authority = require('../models/Authority'); // Adjust path as needed

// A reusable middleware to check if the user is authenticated
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided!' });
  }

  // Expecting a token in the format "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid Token!' });
    }
    // Store decoded user info for use in routes
    req.user = decoded;
    next();
  });
};

// Middleware to check for the 'tourist' role
exports.isTourist = (req, res, next) => {
  if (req.user && req.user.role === 'tourist') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requires Tourist role.' });
  }
};

// Middleware to check for the 'authority' role
exports.isAuthority = (req, res, next) => {
  if (req.user && req.user.role === 'authority') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Requires Authority role.' });
  }
};