import express from 'express';
import { triggerPriceDropAlerts, sendPriceDropAlertEndpoint } from '../services/priceDropAlertService.js';

const router = express.Router();

// Send price drop alert for specific user and listing
router.post('/send', sendPriceDropAlertEndpoint);

// Manual trigger for price drop alerts (for testing)
router.post('/trigger-alerts', triggerPriceDropAlerts);

export default router;
