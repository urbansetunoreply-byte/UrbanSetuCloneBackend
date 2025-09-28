import * as brevo from 'sib-api-v3-sdk';

// Initialize Brevo API client
let brevoApiInstance = null;

// Initialize Brevo service
export const initializeBrevoService = () => {
  try {
    // Check if API key is available
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ Brevo API key not found, Brevo service will be disabled');
      return { success: false, error: 'BREVO_API_KEY not found' };
    }

    // Configure API key
    const defaultClient = brevo.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    // Initialize the API instance
    brevoApiInstance = new brevo.TransactionalEmailsApi();

    console.log('✅ Brevo service initialized successfully');
    return { success: true, message: 'Brevo service initialized' };
  } catch (error) {
    console.error('❌ Brevo service initialization failed:', error);
    return { success: false, error: error.message };
  }
};

// Send email using Brevo
export const sendBrevoEmail = async (emailData) => {
  try {
    // Check if Brevo is available
    if (!process.env.BREVO_API_KEY) {
      return {
        success: false,
        error: 'Brevo API key not configured'
      };
    }

    if (!brevoApiInstance) {
      const initResult = initializeBrevoService();
      if (!initResult.success) {
        return {
          success: false,
          error: 'Brevo service not initialized: ' + initResult.error
        };
      }
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Set email properties
    sendSmtpEmail.subject = emailData.subject;
    sendSmtpEmail.htmlContent = emailData.html;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'UrbanSetu',
      email: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN || 'noreply@urbansetu.com'
    };
    sendSmtpEmail.to = [{ email: emailData.to, name: emailData.toName || emailData.to }];
    
    // Add reply-to if specified
    if (emailData.replyTo) {
      sendSmtpEmail.replyTo = {
        email: emailData.replyTo,
        name: emailData.replyToName || emailData.replyTo
      };
    }

    // Send the email
    const result = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Brevo email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully via Brevo'
    };
  } catch (error) {
    console.error('❌ Brevo email sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Brevo'
    };
  }
};

// Test Brevo connection
export const testBrevoConnection = async () => {
  try {
    // Check if API key is available
    if (!process.env.BREVO_API_KEY) {
      return { 
        success: false, 
        error: 'Brevo API key not configured',
        message: 'Please set BREVO_API_KEY environment variable'
      };
    }

    if (!brevoApiInstance) {
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
      html: '<p>This is a test email to verify Brevo connection.</p>',
      toName: 'Test User'
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
    isInitialized: !!brevoApiInstance,
    hasApiKey: !!process.env.BREVO_API_KEY,
    hasSmtpLogin: !!process.env.BREVO_SMTP_LOGIN,
    hasSmtpPassword: !!process.env.BREVO_SMTP_PASSWORD,
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN,
    senderName: process.env.BREVO_SENDER_NAME || 'UrbanSetu'
  };
};

export default brevoApiInstance;
