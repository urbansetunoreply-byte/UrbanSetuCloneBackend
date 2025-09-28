// Use Brevo SMTP instead of API to avoid SDK import issues
import nodemailer from 'nodemailer';

// Initialize Brevo SMTP transporter
let brevoTransporter = null;

// Initialize Brevo service using SMTP
export const initializeBrevoService = () => {
  try {
    // Check if SMTP credentials are available
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      console.warn('⚠️ Brevo SMTP credentials not found, Brevo service will be disabled');
      return { success: false, error: 'BREVO_SMTP_LOGIN or BREVO_SMTP_PASSWORD not found' };
    }

    console.log('🔧 Initializing Brevo SMTP service...');
    
    // Create Brevo SMTP transporter
    brevoTransporter = nodemailer.createTransporter({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Brevo SMTP service initialized successfully');
    return { success: true, message: 'Brevo SMTP service initialized' };
  } catch (error) {
    console.error('❌ Brevo SMTP service initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message };
  }
};

// Send email using Brevo SMTP
export const sendBrevoEmail = async (emailData) => {
  try {
    // Check if Brevo is available
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      return {
        success: false,
        error: 'Brevo SMTP credentials not configured'
      };
    }

    if (!brevoTransporter) {
      const initResult = initializeBrevoService();
      if (!initResult.success) {
        return {
          success: false,
          error: 'Brevo service not initialized: ' + initResult.error
        };
      }
    }

    // Prepare email options for nodemailer
    const mailOptions = {
      from: {
        name: process.env.BREVO_SENDER_NAME || 'UrbanSetu',
        address: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN
      },
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    };

    // Add reply-to if specified
    if (emailData.replyTo) {
      mailOptions.replyTo = emailData.replyTo;
    }

    // Send the email
    const result = await brevoTransporter.sendMail(mailOptions);
    
    console.log('✅ Brevo email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully via Brevo SMTP'
    };
  } catch (error) {
    console.error('❌ Brevo email sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Brevo SMTP'
    };
  }
};

// Test Brevo connection
export const testBrevoConnection = async () => {
  try {
    // Check if SMTP credentials are available
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      return { 
        success: false, 
        error: 'Brevo SMTP credentials not configured',
        message: 'Please set BREVO_SMTP_LOGIN and BREVO_SMTP_PASSWORD environment variables'
      };
    }

    if (!brevoTransporter) {
      const initResult = initializeBrevoService();
      if (!initResult.success) {
        return { 
          success: false, 
          error: 'Failed to initialize Brevo service: ' + initResult.error 
        };
      }
    }

    // Test with a simple email
    const testEmail = {
      to: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN || 'test@example.com',
      subject: 'Brevo Connection Test - UrbanSetu',
      html: '<p>This is a test email to verify Brevo SMTP connection.</p>'
    };

    const result = await sendBrevoEmail(testEmail);
    return result;
  } catch (error) {
    console.error('❌ Brevo connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Get Brevo service status
export const getBrevoStatus = () => {
  return {
    isInitialized: !!brevoTransporter,
    hasSmtpLogin: !!process.env.BREVO_SMTP_LOGIN,
    hasSmtpPassword: !!process.env.BREVO_SMTP_PASSWORD,
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN,
    senderName: process.env.BREVO_SENDER_NAME || 'UrbanSetu',
    method: 'SMTP'
  };
};

export default brevoTransporter;
