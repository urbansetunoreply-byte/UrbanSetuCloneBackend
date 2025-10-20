import express from 'express';
import { 
    getSyncStatusController, 
    forceSyncController, 
    getCachedDataStats,
    startScheduledSyncController,
    stopScheduledSyncController
} from '../controllers/dataSync.controller.js';

const router = express.Router();

// Get sync status
router.get('/status', getSyncStatusController);

// Force immediate sync
router.post('/force-sync', forceSyncController);

// Get cached data statistics
router.get('/stats', getCachedDataStats);

// Start scheduled sync
router.post('/start-scheduled', startScheduledSyncController);

// Stop scheduled sync
router.post('/stop-scheduled', stopScheduledSyncController);

export default router;
