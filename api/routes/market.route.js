import express from 'express';
import { getMarketOverview, getCityTrends, getAvailableCities } from '../controllers/market.controller.js';

const router = express.Router();

router.get('/overview', getMarketOverview);
router.get('/cities', getAvailableCities);
router.get('/city/:city', getCityTrends);

export default router;
