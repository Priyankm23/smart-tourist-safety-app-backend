const jwt = require("jsonwebtoken");

// Verify JWT token middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Expect "Bearer <token>"
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.user = decoded; // Save decoded payload
    next();
  });
}

// Role-based middlewares
function isTourist(req, res, next) {
  if (req.user?.role === "tourist") return next();
  res.status(403).json({ message: "Requires Tourist role" });
}

function isAuthority(req, res, next) {
  if (req.user?.role === "authority") return next();
  res.status(403).json({ message: "Requires Authority role" });
}

module.exports = { verifyToken, isTourist, isAuthority };
