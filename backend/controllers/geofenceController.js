const Transition = require('../models/Transition');
const { CustomError } = require('../middlewares/errorMiddleware');
const  DangerZone  = require('../models/Geofence');

// @desc    Receive and store user geofence transitions
// @route   POST /api/transitions
// @access  Private (tourist)
exports.receiveGeofenceTransitions = async (req, res, next) => {
  try {
    const { transitions } = req.body;

    if (!Array.isArray(transitions)) {
      return next(new CustomError(400, 'Transitions must be an array.'));
    }
    
    if (transitions.length === 0) {
      return res.status(200).json({ insertedCount: 0 });
    }

    // Add server-side timestamp and user ID
    const docs = transitions.map((t) => ({
      ...t,
      digitalId: req.user.digitalId,
      receivedAt: new Date(),
    }));

    const result = await Transition.insertMany(docs);
    
    res.status(201).json({
      message: 'Geofence transitions received successfully.',
      insertedCount: result.insertedCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.createGeoFenceToDangerLocation = async ( req, res, next) =>{
  try {
    const dangerZone = new DangerZone(req.body);
    await dangerZone.save();
    res.status(201).json({ message: "Danger zone saved successfully", data: dangerZone });
  } catch (error) {
    console.error("Error saving danger zone:", error);
    res.status(500).json({ error: error.message });
    next(error);
  }
};

exports.getallZones = async ( req, res, next ) =>{
  try {
    const zones = await DangerZone.find();
    res.json(zones);
  } catch (err) {
    console.error("Error fetching danger zones:", err);
    res.status(500).json({ error: "Internal server error" });
    next(error);
  }
}

exports.getZonebyId = async ( req, res, next) =>{
  try {
    const zone = await DangerZone.findOne({ id: req.params.id });
    if (!zone) {
      return res.status(404).json({ error: "Danger zone not found" });
    }
    res.json(zone);
  } catch (err) {
    console.error("Error fetching danger zone:", err);
    res.status(500).json({ error: "Internal server error" });
    next(error);
  }
}