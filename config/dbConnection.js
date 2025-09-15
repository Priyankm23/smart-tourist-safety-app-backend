const mongoose = require('mongoose');
const {MONGO_URI} = require('./config');

// Use environment variables for sensitive information

const connectDB = async () => {
  try {
    // Connect to the single primary database
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // The database name is specified in the connection string itself
    });
    
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;