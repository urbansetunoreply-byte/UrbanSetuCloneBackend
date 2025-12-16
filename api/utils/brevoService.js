// Use Brevo API for better reliability
import nodemailer from 'nodemailer';

// Initialize Brevo SMTP transporter (fallback)
let brevoTransporter = null;
let currentConfigIndex = 0;

// Initialize Brevo API service (HTTP-based)
export const initializeBrevoApiService = () => {
  try {
    // Check if API key is available
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ Brevo API key not found, API service will be disabled');
      return { success: false, error: 'BREVO_API_KEY not found' };
    }

    console.log('🔧 Initializing Brevo API service (HTTP-based)...');
    console.log('✅ Brevo API service initialized successfully');
    return { success: true, message: 'Brevo API service initialized' };
  } catch (error) {
    console.error('❌ Brevo API service initialization failed:', error);
    return { success: false, error: error.message };
  }
};

// Send email using Brevo API (HTTP-based)
export const sendBrevoApiEmail = async (emailData) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      return {
        success: false,
        error: 'Brevo API key not configured'
      };
    }

    console.log('📧 Sending email via Brevo API (HTTP)...');
    console.log('🔑 Using API key:', process.env.BREVO_API_KEY ? `${process.env.BREVO_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

    // Use verified sender email from Brevo SMTP login
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_LOGIN;

    if (!senderEmail) {
      return {
        success: false,
        error: 'No verified sender email configured. Please set BREVO_SENDER_EMAIL or BREVO_SMTP_LOGIN'
      };
    }

    // Handle multiple recipients (comma-separated or array)
    let recipients = [];
    if (Array.isArray(emailData.to)) {
      recipients = emailData.to.map(r => typeof r === 'string' ? { email: r.trim(), name: r.trim() } : r);
    } else if (typeof emailData.to === 'string') {
      if (emailData.to.includes(',')) {
        recipients = emailData.to.split(',').map(e => ({ email: e.trim(), name: e.trim() }));
      } else {
        recipients = [{ email: emailData.to, name: emailData.toName || emailData.to }];
      }
    }

    const emailPayload = {
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'UrbanSetu',
        email: senderEmail
      },
      to: recipients,
      subject: emailData.subject,
      htmlContent: emailData.html
    };

    console.log('📤 Email payload:', {
      sender: emailPayload.sender,
      to: emailPayload.to,
      subject: emailPayload.subject
    });

    if (emailData.replyTo) {
      emailPayload.replyTo = {
        email: emailData.replyTo,
        name: emailData.replyTo
      };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      let errorMessage = `Brevo API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.message || errorData.detail || 'Unknown error'}`;
        console.error('❌ Brevo API error details:', errorData);
      } catch (parseError) {
        const errorText = await response.text();
        errorMessage += ` - ${errorText || 'Unknown error'}`;
        console.error('❌ Brevo API error text:', errorText);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    console.log('✅ Brevo API email sent successfully:', result.messageId);
    console.log('📧 Email delivery details:', {
      messageId: result.messageId,
      sender: emailPayload.sender.email,
      recipient: emailData.to,
      subject: emailData.subject
    });

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully via Brevo API',
      deliveryDetails: {
        sender: emailPayload.sender.email,
        recipient: emailData.to,
        subject: emailData.subject
      }
    };
  } catch (error) {
    console.error('❌ Brevo API email sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Brevo API'
    };
  }
};

// Get all available SMTP configurations
const getSmtpConfigs = () => [
  // Config 1: Port 587 (STARTTLS) - Primary
  {
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: false,
    retryDelay: 2000,
    maxRetries: 3,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  },
  // Config 2: Port 465 (SSL) - Fallback
  {
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: false,
    retryDelay: 2000,
    maxRetries: 3,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  },
  // Config 3: Port 25 (Non-encrypted) - Last resort
  {
    host: 'smtp-relay.brevo.com',
    port: 25,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: false,
    retryDelay: 2000,
    maxRetries: 3,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  }
];

// Test different SMTP configurations
export const testSmtpConfigurations = async () => {
  const configs = getSmtpConfigs();
  const results = [];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`🧪 Testing Brevo SMTP config ${i + 1}: ${config.host}:${config.port} (${config.secure ? 'SSL' : 'STARTTLS'})`);

    try {
      const testTransporter = nodemailer.createTransport(config);
      await testTransporter.verify();

      console.log(`✅ Config ${i + 1} successful: ${config.host}:${config.port}`);
      results.push({
        index: i,
        config: config,
        success: true,
        message: `Port ${config.port} (${config.secure ? 'SSL' : 'STARTTLS'}) working`
      });

      // Use the first working configuration
      if (!brevoTransporter) {
        brevoTransporter = testTransporter;
        currentConfigIndex = i;
        console.log(`🎯 Using working config ${i + 1}: ${config.host}:${config.port}`);
      }
    } catch (error) {
      console.log(`❌ Config ${i + 1} failed: ${config.host}:${config.port} - ${error.message}`);
      results.push({
        index: i,
        config: config,
        success: false,
        error: error.message
      });
    }
  }

  return {
    results: results,
    workingConfig: brevoTransporter ? currentConfigIndex : -1,
    hasWorkingConfig: !!brevoTransporter
  };
};

// Initialize Brevo service using SMTP with multiple port fallbacks
export const initializeBrevoService = async () => {
  try {
    // Check if SMTP credentials are available
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      console.warn('⚠️ Brevo SMTP credentials not found, Brevo service will be disabled');
      return { success: false, error: 'BREVO_SMTP_LOGIN or BREVO_SMTP_PASSWORD not found' };
    }

    console.log('🔧 Initializing Brevo SMTP service...');

    // Test all SMTP configurations to find a working one
    const testResults = await testSmtpConfigurations();

    if (testResults.hasWorkingConfig) {
      console.log(`✅ Brevo SMTP service initialized successfully with config ${currentConfigIndex + 1}`);
      return {
        success: true,
        message: `Brevo SMTP service initialized with port ${getSmtpConfigs()[currentConfigIndex].port}`,
        configIndex: currentConfigIndex,
        workingConfig: testResults.workingConfig
      };
    } else {
      console.error('❌ All Brevo SMTP configurations failed');
      return {
        success: false,
        error: 'All Brevo SMTP configurations failed',
        testResults: testResults
      };
    }
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

// Send email using Brevo (API first, then SMTP fallback)
export const sendBrevoEmail = async (emailData, maxRetries = 3) => {
  try {
    // Try Brevo API first (more reliable)
    if (process.env.BREVO_API_KEY) {
      console.log('📧 Attempting to send email via Brevo API...');
      const apiResult = await sendBrevoApiEmail(emailData);

      if (apiResult.success) {
        console.log('✅ Email sent successfully via Brevo API');
        return {
          success: true,
          messageId: apiResult.messageId,
          message: 'Email sent successfully via Brevo API',
          method: 'API'
        };
      } else {
        console.log('❌ Brevo API failed, falling back to SMTP:', apiResult.error);
      }
    }

    // Fallback to SMTP if API fails or not available
    console.log('📧 Falling back to Brevo SMTP...');

    // Check if SMTP credentials are available
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      return {
        success: false,
        error: 'Both Brevo API and SMTP credentials not configured'
      };
    }

    if (!brevoTransporter) {
      const initResult = await initializeBrevoService();
      if (!initResult.success) {
        return {
          success: false,
          error: 'Brevo SMTP service not initialized: ' + initResult.error
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

    // Retry logic for Brevo SMTP
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Brevo SMTP send attempt ${attempt}/${maxRetries}...`);

        // Verify connection before each attempt
        if (attempt > 1) {
          console.log('🔄 Re-verifying Brevo SMTP connection...');
          await brevoTransporter.verify();
        }

        const result = await brevoTransporter.sendMail(mailOptions);

        console.log('✅ Brevo SMTP email sent successfully:', result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully via Brevo SMTP',
          attempts: attempt,
          method: 'SMTP'
        };
      } catch (error) {
        console.error(`❌ Brevo SMTP send attempt ${attempt} failed:`, error.message);

        // Check for specific error types
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
          console.log('🔄 Connection error detected, reinitializing Brevo SMTP transporter...');

          // Reinitialize transporter
          const reinitResult = await initializeBrevoService();
          if (!reinitResult.success) {
            console.error('❌ Failed to reinitialize Brevo SMTP transporter:', reinitResult.error);
          }
        }

        // If this is the last attempt, return error
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message || 'Failed to send email via Brevo SMTP',
            attempts: attempt,
            errorCode: error.code,
            method: 'SMTP'
          };
        }

        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error('❌ Brevo email sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Brevo'
    };
  }
};

// Test Brevo connection with verification
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

    // Test connection first
    console.log('🔍 Testing Brevo SMTP connection...');
    await brevoTransporter.verify();
    console.log('✅ Brevo SMTP connection verified successfully');

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
    method: 'SMTP',
    host: 'smtp-relay.brevo.com',
    port: 587
  };
};

export default brevoTransporter;
