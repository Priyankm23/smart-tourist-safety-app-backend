const {config} = require("dotenv");

config({path : `.env`});

module.exports={
    PORT,
    MONGO_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    POLYGON_RPC,
    SMART_CONTRACT_ADDRESS,
    SMART_CONTRACT_ADDRESS_reg,
    SMART_CONTRACT_ADDRESS_sos,
    PRIVATE_KEY,
    SERVER_URL,
    CLOUDINARY_NAME,
    CLOUDINARY_KEY,
    CLOUDINARY_SECRET,
    ENCRYPTION_KEY
}=process.env