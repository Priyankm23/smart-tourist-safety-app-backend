const http = require('http');
const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors'); 
const {PORT,NODE_ENV} = require('./config/config')
const connectDB = require('./config/dbConnection');
const authRoutes = require('./routes/authRoutes');
const touristRoutes = require('./routes/touristRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const sosRoutes = require('./routes/sosRoutes');
const geofenceRoutes = require('./routes/geofenceRoutes');
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
// realTimeService.init(httpServer);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({
  strict: true, // ensures invalid JSON is rejected
  limit: '1mb'
}));

app.use(cors({
  origin: 'http://localhost:5173', // replace with your frontend origin
  credentials: true,
}));


app.use('/api/auth', authRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/heatmap', authorityRoutes);
app.use('/api/authority',authorityRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/sos',sosRoutes);

// === Server Start ===
server.listen(PORT, async() => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  await connectDB();
});