const {config} = require("dotenv");

config({path : `.env`});

module.exports={
    PORT,
    DB_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,
    SERVER_URL,
    CLOUDINARY_NAME,CLOUDINARY_KEY,CLOUDINARY_SECRET
}=process.env