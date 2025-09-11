const express = require('express');
const {triggerSOS } = require('../controllers/SOSalertController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router  = express.Router();

router.post('/trigger',triggerSOS);

module.exports = router;