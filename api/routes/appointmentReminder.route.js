import express from 'express';
import { triggerAppointmentReminders } from '../services/appointmentReminderService.js';

const router = express.Router();

// Manual trigger for appointment reminders (for testing)
router.post('/trigger-reminders', triggerAppointmentReminders);

export default router;
