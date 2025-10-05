import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import { sendOutdatedAppointmentEmail } from '../utils/emailService.js';

// Check and send emails for outdated appointments
export const checkAndSendOutdatedAppointmentEmails = async () => {
  try {
    console.log('🔍 Checking for outdated appointments...');
    
    // Get current date and time
    const now = new Date();
    const currentDateString = now.toISOString().split('T')[0];
    const currentTimeString = now.toTimeString().split(' ')[0];
    
    console.log(`📅 Current date: ${currentDateString}, Current time: ${currentTimeString}`);
    
    // Calculate date range for recent expired appointments (24-48 hours ago)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    const yesterdayString = yesterday.toISOString().split('T')[0];
    const dayBeforeYesterdayString = dayBeforeYesterday.toISOString().split('T')[0];
    
    console.log(`📅 Checking for appointments expired between ${dayBeforeYesterdayString} and ${yesterdayString}`);
    
    // Find appointments that are outdated (past date or past time on current date)
    // Only check appointments that expired in the last 24-48 hours
    // Exclude appointments that already have outdated emails sent
    const outdatedAppointments = await Booking.find({
      $or: [
        // Past dates within the last 48 hours
        { 
          date: { $gte: dayBeforeYesterdayString, $lt: currentDateString },
          status: { $in: ["pending", "accepted"] }
        },
        // Past times on current date (today's appointments that are past)
        { 
          date: currentDateString,
          time: { $lt: currentTimeString },
          status: { $in: ["pending", "accepted"] }
        }
      ],
      // Exclude appointments that already have outdated emails sent
      outdatedEmailSent: { $ne: true }
    })
    .populate('buyerId', 'username email firstName lastName')
    .populate('sellerId', 'username email firstName lastName')
    .populate('listingId', 'name description address imageUrls regularPrice')
    .lean();
    
    console.log(`📋 Found ${outdatedAppointments.length} outdated appointments`);
    
    if (outdatedAppointments.length === 0) {
      console.log('✅ No outdated appointments found');
      return { success: true, message: 'No outdated appointments found', count: 0 };
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const processedAppointments = [];
    
    // Process each outdated appointment
    for (const appointment of outdatedAppointments) {
      try {
        // Update appointment status to outdated and mark email as sent
        await Booking.findByIdAndUpdate(appointment._id, {
          status: 'outdated',
          outdatedEmailSent: true,
          updatedAt: new Date()
        });
        
        // Prepare appointment details
        const appointmentDetails = {
          appointmentId: appointment._id,
          propertyName: appointment.propertyName,
          propertyDescription: appointment.propertyDescription,
          propertyAddress: appointment.listingId?.address || 'Address not available',
          propertyPrice: appointment.listingId?.regularPrice || 0,
          propertyImages: appointment.listingId?.imageUrls || [],
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
          listingId: appointment.listingId?._id,
          message: appointment.message || ''
        };
        
        // Send email to buyer
        if (appointmentDetails.buyerEmail && appointmentDetails.buyerEmail !== 'Unknown') {
          try {
            const buyerResult = await sendOutdatedAppointmentEmail(
              appointmentDetails.buyerEmail,
              appointmentDetails,
              'buyer'
            );
            
            if (buyerResult.success) {
              console.log(`✅ Outdated appointment email sent to buyer: ${appointmentDetails.buyerEmail}`);
              successCount++;
            } else {
              console.error(`❌ Failed to send outdated appointment email to buyer: ${appointmentDetails.buyerEmail}`, buyerResult.error);
              errorCount++;
              errors.push(`Buyer ${appointmentDetails.buyerEmail}: ${buyerResult.error}`);
            }
          } catch (buyerError) {
            console.error(`❌ Error sending outdated appointment email to buyer: ${appointmentDetails.buyerEmail}`, buyerError);
            errorCount++;
            errors.push(`Buyer ${appointmentDetails.buyerEmail}: ${buyerError.message}`);
          }
        }
        
        // Send email to seller
        if (appointmentDetails.sellerEmail && appointmentDetails.sellerEmail !== 'Unknown') {
          try {
            const sellerResult = await sendOutdatedAppointmentEmail(
              appointmentDetails.sellerEmail,
              appointmentDetails,
              'seller'
            );
            
            if (sellerResult.success) {
              console.log(`✅ Outdated appointment email sent to seller: ${appointmentDetails.sellerEmail}`);
              successCount++;
            } else {
              console.error(`❌ Failed to send outdated appointment email to seller: ${appointmentDetails.sellerEmail}`, sellerResult.error);
              errorCount++;
              errors.push(`Seller ${appointmentDetails.sellerEmail}: ${sellerResult.error}`);
            }
          } catch (sellerError) {
            console.error(`❌ Error sending outdated appointment email to seller: ${appointmentDetails.sellerEmail}`, sellerError);
            errorCount++;
            errors.push(`Seller ${appointmentDetails.sellerEmail}: ${sellerError.message}`);
          }
        }
        
        processedAppointments.push({
          appointmentId: appointment._id,
          propertyName: appointmentDetails.propertyName,
          buyerEmail: appointmentDetails.buyerEmail,
          sellerEmail: appointmentDetails.sellerEmail,
          date: appointmentDetails.date,
          time: appointmentDetails.time
        });
        
      } catch (appointmentError) {
        console.error(`❌ Error processing outdated appointment ${appointment._id}:`, appointmentError);
        errorCount++;
        errors.push(`Appointment ${appointment._id}: ${appointmentError.message}`);
      }
    }
    
    const result = {
      success: errorCount === 0,
      message: `Processed ${outdatedAppointments.length} outdated appointments. ${successCount} emails sent successfully, ${errorCount} failed.`,
      totalAppointments: outdatedAppointments.length,
      successCount,
      errorCount,
      processedAppointments,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(`📊 Outdated appointment email summary:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in checkAndSendOutdatedAppointmentEmails:', error);
    return {
      success: false,
      message: 'Failed to check outdated appointments',
      error: error.message
    };
  }
};

// Function to manually trigger outdated appointment emails (for testing)
export const triggerOutdatedAppointmentEmails = async (req, res) => {
  try {
    console.log('🚀 Manually triggering outdated appointment emails...');
    const result = await checkAndSendOutdatedAppointmentEmails();
    
    res.status(200).json({
      success: true,
      message: 'Outdated appointment email check completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in triggerOutdatedAppointmentEmails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger outdated appointment emails',
      error: error.message
    });
  }
};
