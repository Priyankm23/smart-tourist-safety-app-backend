const {config} = require("dotenv");

config({path : `.env`});

module.exports={
    PORT,
    DB_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    POLYGON_RPC,SMART_CONTRACT_ADDRESS,PRIVATE_KEY,
    SERVER_URL,
    CLOUDINARY_NAME,CLOUDINARY_KEY,CLOUDINARY_SECRET
}=process.env