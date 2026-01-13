const jwt = require("jsonwebtoken");
const { JWT_SECRET} = require("../config/config");
const Authority = require("../models/Authority");

function verifyAuthorityToken(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const token = req.cookies.auth_token;
      if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

      const decoded = jwt.verify(token, JWT_SECRET);
      req.authority = decoded;

      // Role check if roles are provided
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.authority.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient role" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  };
}

module.exports = verifyAuthorityToken;
