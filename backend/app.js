const http = require('http');
const express = require('express');
const morgan = require('morgan'); // For API logging
const cors = require('cors'); // To handle Cross-Origin Resource Sharing
const {PORT,NODE_ENV} = require('./config/config')
const connectDB = require('./config/dbConnection');

// Load environment variables from .env file

// Import routes and services
const authRoutes = require('./routes/authRoutes');
const touristRoutes = require('./routes/touristRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const realTimeService = require('./services/realtimeService');
const geofenceRoutes = require('./routes/geofenceRoutes');

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO with the HTTP server
realTimeService.init(httpServer);

// === Middlewares ===
// Enable CORS for all requests
app.use(cors());

// Log HTTP requests to the console
app.use(morgan('dev'));

// Parse incoming JSON requests
app.use(express.json());

// === API Routes ===
// Mount the imported routers to their base paths
app.use('/api/auth', authRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/geofence', geofenceRoutes);

// === Server Start ===
httpServer.listen(PORT, async() => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  await connectDB();
});