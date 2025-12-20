const express = require('express');
const router = express.Router();
const turnController = require('../controllers/turn.controller');
const { verifyToken } = require('../middleware/auth.middleware'); // Assuming you have auth middleware

// Endpoint to secure TURN credentials
// Protected by verifyToken to ensuring only logged-in users drain your quota
router.get('/turn-credentials', verifyToken, turnController.getTurnCredentials);

module.exports = router;
