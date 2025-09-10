// backend/utils/ethFormat.js
exports.hex64ToBytes32=(hex64)=> {
  if (hex64.startsWith("0x")) hex64 = hex64.slice(2);
  if (hex64.length !== 64) throw new Error("invalid sha256 hex length");
  return "0x" + hex64;
}
