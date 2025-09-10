const http = require('http');
const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors'); 
const {PORT,NODE_ENV} = require('./config/config')
const connectDB = require('./config/dbConnection');

const authRoutes = require('./routes/authRoutes');
const touristRoutes = require('./routes/touristRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const realTimeService = require('./services/realtimeService');
const geofenceRoutes = require('./routes/geofenceRoutes');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO with the HTTP server
realTimeService.init(httpServer);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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