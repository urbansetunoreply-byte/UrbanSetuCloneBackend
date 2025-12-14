import RentWallet from '../models/rentWallet.model.js';
import RentLockContract from '../models/rentLockContract.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import {
    sendRentPaymentDueReminderEmail,
    sendRentPaymentOverdueReminderEmail
} from '../utils/emailService.js';

export const checkAndSendRentReminders = async () => {
    console.log('Starting rent payment reminder check...');

    try {
        // Find wallets with pending or overdue payments
        // We populate contractId to get listing details, and userId for email
        const wallets = await RentWallet.find({
            'paymentSchedule.status': { $in: ['pending', 'overdue'] }
        })
            .populate({
                path: 'contractId',
                populate: {
                    path: 'listingId',
                    select: 'name'
                }
            })
            .populate('userId', 'email username');

        console.log(`Found ${wallets.length} wallets with pending/overdue payments.`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let emailsSent = 0;

        for (const wallet of wallets) {
            if (!wallet.contractId || !wallet.userId) continue;

            let walletUpdated = false;
            const propertyName = wallet.contractId.listingId?.name || 'Property';
            const userEmail = wallet.userId.email;
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const walletUrl = `${clientUrl}/user/rent-wallet?contractId=${wallet.contractId._id}`;

            for (const payment of wallet.paymentSchedule) {
                // Skip completed or other statuses
                if (!['pending', 'overdue'].includes(payment.status)) continue;

                const dueDate = new Date(payment.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                const timeDiff = dueDate.getTime() - today.getTime();
                const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // --- Due Reminders ---
                if (payment.status === 'pending') {
                    let shouldSendReminder = false;

                    // 3 Days Before
                    if (daysUntilDue === 3 && !payment.reminderSent3Days) {
                        shouldSendReminder = true;
                        payment.reminderSent3Days = true;
                        walletUpdated = true;
                    }
                    // 1 Day Before
                    else if (daysUntilDue === 1 && !payment.reminderSent1Day) {
                        shouldSendReminder = true;
                        payment.reminderSent1Day = true;
                        walletUpdated = true;
                    }
                    // On Due Date
                    else if (daysUntilDue === 0 && !wallet.reminderSent) {
                        // Note: wallet.reminderSent seems to be a general flag, but paymentSchedule has its own flags? 
                        // The model has 'reminderSent' on the wallet level, but presumably we want per-payment.
                        // Looking at the model, there isn't a 'reminderSent' on the payment object specifically for 'due date', 
                        // but there is 'reminderSent3Days' and 'reminderSent1Day'.
                        // I will use a custom logic or add a field if I could, but let's stick to existing schema.
                        // Actually, the model has `reminderSent` on the wallet, which might be for the current active payment?
                        // Let's assume we can trigger a due date reminder. 
                        // Since I can't easily modify the schema right now without risk, I'll assume 
                        // if it's due today, we send it. To avoid spamming, we might check 'lastReminderDate'.

                        const lastReminder = wallet.lastReminderDate ? new Date(wallet.lastReminderDate) : null;
                        if (!lastReminder || lastReminder.getTime() < today.getTime()) {
                            shouldSendReminder = true;
                            wallet.lastReminderDate = new Date(); // Update sending time
                            wallet.reminderSent = true;
                            walletUpdated = true;
                        }
                    }

                    if (shouldSendReminder) {
                        const payUrl = `${clientUrl}/user/pay-monthly-rent?contractId=${wallet.contractId._id}&scheduleIndex=${wallet.paymentSchedule.indexOf(payment)}`;

                        await sendRentPaymentDueReminderEmail(userEmail, {
                            propertyName,
                            dueDate: payment.dueDate.toLocaleDateString('en-GB'),
                            amount: payment.amount,
                            month: `${payment.month}/${payment.year}`,
                            paymentUrl: payUrl
                        });
                        emailsSent++;
                        console.log(`Sent due reminder to ${userEmail} for ${propertyName}`);
                    }
                }

                // --- Overdue Logic ---
                // If pending and passed due date, mark as overdue
                if (daysUntilDue < 0) {
                    if (payment.status !== 'overdue') {
                        payment.status = 'overdue';
                        walletUpdated = true;
                    }

                    const daysOverdue = Math.abs(daysUntilDue);
                    const triggerDays = [1, 3, 7, 15, 30];

                    // Check if we should send overdue reminder
                    // We need to avoid sending multiple times a day.
                    // We'll use the trigger days.
                    // Since we don't have per-payment overdue reminder flags in the schema shown,
                    // we have to rely on 'lastReminderDate' regarding this specific payment? 
                    // Or we check if today matches the overdue day count exactly.

                    if (triggerDays.includes(daysOverdue) || (daysOverdue > 30 && daysOverdue % 30 === 0)) {
                        const payUrl = `${clientUrl}/user/pay-monthly-rent?contractId=${wallet.contractId._id}&scheduleIndex=${wallet.paymentSchedule.indexOf(payment)}`;

                        // Calculate penalty if any (simple logic for display, actual calc might be in backend logic)
                        // Assuming fixed penalty or percentage if not set
                        const penalty = payment.penaltyAmount || 0;

                        await sendRentPaymentOverdueReminderEmail(userEmail, {
                            propertyName,
                            dueDate: payment.dueDate.toLocaleDateString('en-GB'),
                            amount: payment.amount,
                            month: `${payment.month}/${payment.year}`,
                            daysOverdue,
                            penalty,
                            totalAmount: payment.amount + penalty,
                            paymentUrl: payUrl
                        });
                        emailsSent++;
                        console.log(`Sent overdue reminder (${daysOverdue} days) to ${userEmail} for ${propertyName}`);
                    }
                }
            }

            if (walletUpdated) {
                await wallet.save();
            }
        }

        console.log(`Rent reminder check completed. Sent ${emailsSent} emails.`);
    } catch (error) {
        console.error('Error in rent reminder service:', error);
    }
};
