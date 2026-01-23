const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createGroup,
  joinGroup,
  getGroupDashboard,
  updateGroupItinerary,
} = require("../controllers/tourGroupController");

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.post("/create", createGroup);
router.post("/join", joinGroup);
router.get("/dashboard", getGroupDashboard);
router.put("/update", updateGroupItinerary);

module.exports = router;
