const crypto = require("crypto");

exports.sha256Hex=(data)=> {
  return crypto.createHash("sha256").update(data).digest("hex");
}
