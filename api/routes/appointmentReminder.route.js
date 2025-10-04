import express from 'express';
import { triggerAppointmentReminders } from '../services/appointmentReminderService.js';
import { triggerOutdatedAppointmentEmails } from '../services/outdatedAppointmentService.js';

const router = express.Router();

// Manual trigger for appointment reminders (for testing)
router.post('/trigger-reminders', triggerAppointmentReminders);

// Manual trigger for outdated appointment emails (for testing)
router.post('/trigger-outdated-emails', triggerOutdatedAppointmentEmails);

export default router;
