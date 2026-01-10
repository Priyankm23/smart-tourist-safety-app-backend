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
const { updateRiskScores } = require('./services/riskEngineService');
const { fetchNewsIncidents } = require('./services/newsService');

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

// Allow both React App (5173) and our Test HTML (127.0.0.1:5500 usually via Live Server)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5500', 'http://localhost:5500'], 
  credentials: true,
}));

app.get("/",(req,res)=>{
  routes={
    "authenticatioin":"/api/auth",
    "tourist":"/api/tourist",
    "heatmap":"/api/heatmap",
    "authority":"/api/authority",
    "geofence":"/api/geofence",
    "sos":"/api/sos"
  }
  res.status(200).json({message:"tourist safety main aapka swagat hai !",routes:routes});
})

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

  // Start Background Services
  console.log("Starting Risk Engine & News Service...");

  const runJobs = async () => {
    try {
      // Future Enhancement: Get list of active tourist cities from DB
      // const activeCities = await Tourist.distinct('currentCity'); 
      // for(const city of activeCities) await fetchNewsIncidents(city);
      
      // Example for Kashmir (Testing Dynamic City Support)
      await fetchNewsIncidents({ 
        name: 'Kashmir', 
        lat: 34.0837, 
        lng: 74.7973 
      }); 

      await updateRiskScores();   // Recalculate risks globaly
    } catch (err) {
      console.error("Job Error:", err);
    }
  };

  // Run on startup
  runJobs();
  
  // Schedule every 30 mins
  setInterval(runJobs, 30 * 60 * 1000);
});