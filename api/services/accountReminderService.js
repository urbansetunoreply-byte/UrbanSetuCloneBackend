import DeletedAccount from '../models/deletedAccount.model.js';
import AccountRevocation from '../models/accountRevocation.model.js';
import { sendAccountDeletionReminderEmail, sendAccountDeletionFinalWarningEmail } from '../utils/emailService.js';

/**
 * Send reminder emails for accounts that are approaching their purge date
 * This function checks for accounts that need 15-day reminders or final warnings
 */
export const sendAccountDeletionReminders = async () => {
  try {
    console.log('📧 Starting account deletion reminder process...');

    const now = new Date();
    const results = {
      fifteenDayReminders: [],
      fiveDayReminders: [],
      finalWarnings: [],
      errors: []
    };

    // Find all softbanned accounts that haven't been purged
    const softbannedAccounts = await DeletedAccount.find({
      purgedAt: null // Not purged yet
    }).populate('accountId', 'email username role');

    console.log(`📋 Found ${softbannedAccounts.length} softbanned accounts to check for reminders`);

    for (const account of softbannedAccounts) {
      try {
        const daysSinceDeletion = Math.floor((now - account.deletedAt) / (1000 * 60 * 60 * 24));
        const daysLeft = 30 - daysSinceDeletion;

        // Skip if account is too new (less than 15 days) or already expired
        if (daysSinceDeletion < 15 || daysLeft <= 0) {
          continue;
        }

        // Find the active revocation token for this SPECIFIC account
        const revocationRecord = await AccountRevocation.findOne({
          accountId: account.accountId,  // Match by account ID, not just email
          isUsed: false,
          expiresAt: { $gt: now }
        });

        if (!revocationRecord) {
          console.log(`⚠️ No active revocation token found for ${account.email}`);
          continue;
        }

        const revocationLink = `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/restore-account/${revocationRecord.revocationToken}`;
        const userDetails = {
          username: account.name,
          role: account.role
        };

        // Send 15-day reminder (exactly on day 15)
        if (daysSinceDeletion === 15) {
          console.log(`📧 Sending 15-day reminder to ${account.email} (${daysLeft} days left)`);

          try {
            await sendAccountDeletionReminderEmail(
              account.email,
              userDetails,
              revocationLink,
              daysLeft
            );

            results.fifteenDayReminders.push({
              email: account.email,
              username: account.name,
              daysLeft,
              sentAt: new Date()
            });

            console.log(`✅ 15-day reminder sent to ${account.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send 15-day reminder to ${account.email}:`, emailError.message);
            results.errors.push({
              email: account.email,
              type: 'fifteen_day_reminder',
              error: emailError.message
            });
          }
        }

        // Send 5-day reminder (exactly on day 25)
        if (daysSinceDeletion === 25) {
          console.log(`⏱️ Sending 5-day reminder to ${account.email} (${daysLeft} days left)`);

          try {
            await sendAccountDeletionReminderEmail(
              account.email,
              userDetails,
              revocationLink,
              daysLeft
            );

            results.fiveDayReminders.push({
              email: account.email,
              username: account.name,
              daysLeft,
              sentAt: new Date()
            });

            console.log(`✅ 5-day reminder sent to ${account.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send 5-day reminder to ${account.email}:`, emailError.message);
            results.errors.push({
              email: account.email,
              type: 'five_day_reminder',
              error: emailError.message
            });
          }
        }

        // Send final warning (1 day before purge)
        if (daysLeft === 1) {
          console.log(`🚨 Sending final warning to ${account.email} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)`);

          try {
            await sendAccountDeletionFinalWarningEmail(
              account.email,
              userDetails,
              revocationLink,
              daysLeft
            );

            results.finalWarnings.push({
              email: account.email,
              username: account.name,
              daysLeft,
              sentAt: new Date()
            });

            console.log(`✅ Final warning sent to ${account.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send final warning to ${account.email}:`, emailError.message);
            results.errors.push({
              email: account.email,
              type: 'final_warning',
              error: emailError.message
            });
          }
        }

      } catch (accountError) {
        console.error(`❌ Error processing account ${account.email}:`, accountError.message);
        results.errors.push({
          email: account.email,
          type: 'processing_error',
          error: accountError.message
        });
      }
    }

    const totalSent = results.fifteenDayReminders.length + results.fiveDayReminders.length + results.finalWarnings.length;
    console.log(`✅ Account deletion reminder process completed: ${totalSent} emails sent (${results.fifteenDayReminders.length} 15-day, ${results.fiveDayReminders.length} 5-day, ${results.finalWarnings.length} final), ${results.errors.length} errors`);

    return {
      success: true,
      message: `Reminder process completed. ${totalSent} emails sent.`,
      results
    };

  } catch (error) {
    console.error('❌ Error in account deletion reminder process:', error);
    return {
      success: false,
      message: 'Error in reminder process',
      error: error.message,
      results: {
        fifteenDayReminders: [],
        fiveDayReminders: [],
        finalWarnings: [],
        errors: []
      }
    };
  }
};

/**
 * Get statistics about accounts that need reminders
 */
export const getReminderStatistics = async () => {
  try {
    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

    // Find accounts eligible for 15-day reminders
    const fifteenDayEligible = await DeletedAccount.find({
      deletedAt: { $lte: fifteenDaysAgo },
      purgedAt: null
    });

    // Find accounts eligible for 5-day reminders
    const fiveDayEligible = await DeletedAccount.find({
      deletedAt: { $lte: twentyFiveDaysAgo },
      purgedAt: null
    });

    // Find accounts eligible for final warnings (1 day before purge)
    const finalWarningEligible = await DeletedAccount.find({
      deletedAt: { $lte: oneDayFromNow },
      purgedAt: null
    });

    return {
      success: true,
      fifteenDayEligible: fifteenDayEligible.length,
      fiveDayEligible: fiveDayEligible.length,
      finalWarningEligible: finalWarningEligible.length,
      totalSoftbanned: await DeletedAccount.countDocuments({ purgedAt: null })
    };
  } catch (error) {
    console.error('Error getting reminder statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
