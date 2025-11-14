import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import { sendAppointmentReminderEmail } from '../utils/emailService.js';

// Check and send appointment reminders for appointments within 24 hours
export const checkAndSendAppointmentReminders = async () => {
  try {
    console.log('🔍 Checking for appointments within 24 hours...');
    
    // Get current date and time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set time range for tomorrow (00:00 to 23:59)
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    console.log(`📅 Checking appointments for: ${startOfTomorrow.toISOString()} to ${endOfTomorrow.toISOString()}`);
    
    // Find appointments scheduled for tomorrow with accepted status
    const appointments = await Booking.find({
      date: {
        $gte: startOfTomorrow,
        $lte: endOfTomorrow
      },
      status: 'accepted'
    })
    .populate('buyerId', 'username email firstName lastName')
    .populate('sellerId', 'username email firstName lastName')
    .populate('listingId', 'name description')
    .lean();
    
    console.log(`📋 Found ${appointments.length} appointments for tomorrow`);
    
    if (appointments.length === 0) {
      console.log('✅ No appointments found for tomorrow');
      return { success: true, message: 'No appointments found for tomorrow', count: 0 };
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each appointment
    for (const appointment of appointments) {
      try {
        // Prepare appointment details
        const appointmentDetails = {
          propertyName: appointment.propertyName,
          propertyDescription: appointment.propertyDescription,
          date: appointment.date,
          time: appointment.time,
          buyerName: appointment.buyerId?.firstName && appointment.buyerId?.lastName 
            ? `${appointment.buyerId.firstName} ${appointment.buyerId.lastName}`
            : appointment.buyerId?.username || 'Unknown',
          buyerEmail: appointment.buyerId?.email || appointment.email,
          sellerName: appointment.sellerId?.firstName && appointment.sellerId?.lastName 
            ? `${appointment.sellerId.firstName} ${appointment.sellerId.lastName}`
            : appointment.sellerId?.username || 'Unknown',
          sellerEmail: appointment.sellerId?.email || 'Unknown',
          purpose: appointment.purpose,
          listingId: appointment.listingId?._id
        };
        
        // Send reminder to buyer
        if (appointmentDetails.buyerEmail && appointmentDetails.buyerEmail !== 'Unknown') {
          try {
            const buyerResult = await sendAppointmentReminderEmail(
              appointmentDetails.buyerEmail,
              appointmentDetails,
              'buyer'
            );
            
            if (buyerResult.success) {
              console.log(`✅ Reminder sent to buyer: ${appointmentDetails.buyerEmail}`);
              successCount++;
            } else {
              console.error(`❌ Failed to send reminder to buyer: ${appointmentDetails.buyerEmail}`, buyerResult.error);
              errorCount++;
              errors.push(`Buyer ${appointmentDetails.buyerEmail}: ${buyerResult.error}`);
            }
          } catch (buyerError) {
            console.error(`❌ Error sending reminder to buyer: ${appointmentDetails.buyerEmail}`, buyerError);
            errorCount++;
            errors.push(`Buyer ${appointmentDetails.buyerEmail}: ${buyerError.message}`);
          }
        }
        
        // Send reminder to seller
        if (appointmentDetails.sellerEmail && appointmentDetails.sellerEmail !== 'Unknown') {
          try {
            const sellerResult = await sendAppointmentReminderEmail(
              appointmentDetails.sellerEmail,
              appointmentDetails,
              'seller'
            );
            
            if (sellerResult.success) {
              console.log(`✅ Reminder sent to seller: ${appointmentDetails.sellerEmail}`);
              successCount++;
            } else {
              console.error(`❌ Failed to send reminder to seller: ${appointmentDetails.sellerEmail}`, sellerResult.error);
              errorCount++;
              errors.push(`Seller ${appointmentDetails.sellerEmail}: ${sellerResult.error}`);
            }
          } catch (sellerError) {
            console.error(`❌ Error sending reminder to seller: ${appointmentDetails.sellerEmail}`, sellerError);
            errorCount++;
            errors.push(`Seller ${appointmentDetails.sellerEmail}: ${sellerError.message}`);
          }
        }
        
      } catch (appointmentError) {
        console.error(`❌ Error processing appointment ${appointment._id}:`, appointmentError);
        errorCount++;
        errors.push(`Appointment ${appointment._id}: ${appointmentError.message}`);
      }
    }
    
    const result = {
      success: errorCount === 0,
      message: `Processed ${appointments.length} appointments. ${successCount} reminders sent successfully, ${errorCount} failed.`,
      totalAppointments: appointments.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(`📊 Appointment reminder summary:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in checkAndSendAppointmentReminders:', error);
    return {
      success: false,
      message: 'Failed to check appointment reminders',
      error: error.message
    };
  }
};

// Function to manually trigger appointment reminders (for testing)
export const triggerAppointmentReminders = async (req, res) => {
  try {
    console.log('🚀 Manually triggering appointment reminders...');
    const result = await checkAndSendAppointmentReminders();
    
    res.status(200).json({
      success: true,
      message: 'Appointment reminder check completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in triggerAppointmentReminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger appointment reminders',
      error: error.message
    });
  }
};
