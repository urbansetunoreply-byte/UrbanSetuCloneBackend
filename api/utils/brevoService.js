// Use Brevo SMTP instead of API to avoid SDK import issues
import nodemailer from 'nodemailer';

// Initialize Brevo SMTP transporter
let brevoTransporter = null;
let currentConfigIndex = 0;

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

// Send email using Brevo SMTP with enhanced retry logic
export const sendBrevoEmail = async (emailData, maxRetries = 3) => {
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

    // Retry logic for Brevo
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Brevo send attempt ${attempt}/${maxRetries}...`);
        
        // Verify connection before each attempt
        if (attempt > 1) {
          console.log('🔄 Re-verifying Brevo connection...');
          await brevoTransporter.verify();
        }
        
        const result = await brevoTransporter.sendMail(mailOptions);
        
        console.log('✅ Brevo email sent successfully:', result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully via Brevo SMTP',
          attempts: attempt
        };
      } catch (error) {
        console.error(`❌ Brevo send attempt ${attempt} failed:`, error.message);
        
        // Check for specific error types
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
          console.log('🔄 Connection error detected, reinitializing Brevo transporter...');
          
          // Reinitialize transporter
          const reinitResult = initializeBrevoService();
          if (!reinitResult.success) {
            console.error('❌ Failed to reinitialize Brevo transporter:', reinitResult.error);
          }
        }
        
        // If this is the last attempt, return error
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message || 'Failed to send email via Brevo SMTP',
            attempts: attempt,
            errorCode: error.code
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
      error: error.message || 'Failed to send email via Brevo SMTP'
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
