const express = require('express');
const {triggerSOS } = require('../controllers/SOSalertController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { arcjetSosMiddleware } = require('../middlewares/ArcjetMiddleware');

const router  = express.Router();

router.use(verifyToken,arcjetSosMiddleware);

router.post('/trigger',verifyToken,triggerSOS);

module.exports = router;