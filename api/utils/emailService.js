import nodemailer from 'nodemailer';
import { sendBrevoEmail, initializeBrevoService, initializeBrevoApiService, testBrevoConnection, getBrevoStatus } from './brevoService.js';

// Enhanced transporter configuration with multiple fallback options
const createTransporter = () => {
  const baseConfig = {
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
    // Very conservative timeout settings for Render
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
    // Disable connection pooling
    pool: false,
    // Retry configuration
    retryDelay: 1000,
    maxRetries: 2
  };

  // Try different Gmail configurations
  const configs = [
    // Configuration 1: Gmail with port 587 (STARTTLS)
    {
      ...baseConfig,
      service: 'gmail',
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    },
    // Configuration 2: Gmail with port 465 (SSL)
    {
      ...baseConfig,
      service: 'gmail',
      port: 465,
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    },
    // Configuration 3: Direct SMTP configuration
    {
      ...baseConfig,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    }
  ];

  return configs[0]; // Start with the first configuration
};

const transporter = nodemailer.createTransport(createTransporter());

// Email delivery tracking
const emailDeliveryStats = {
  sent: 0,
  failed: 0,
  retries: 0,
  lastSent: null,
  lastError: null
};

// Create multiple transporter configurations for fallback
const createTransporterConfigs = () => {
  const baseConfig = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
    pool: false
  };

  return [
    // Config 1: Gmail with port 587 (STARTTLS)
    {
      ...baseConfig,
      service: 'gmail',
      port: 587,
      secure: false,
      tls: { rejectUnauthorized: false }
    },
    // Config 2: Gmail with port 465 (SSL)
    {
      ...baseConfig,
      service: 'gmail',
      port: 465,
      secure: true,
      tls: { rejectUnauthorized: false }
    },
    // Config 3: Direct SMTP
    {
      ...baseConfig,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      tls: { rejectUnauthorized: false }
    }
  ];
};

let currentTransporter = null;
let transporterIndex = 0;

// Initialize transporter with fallback
const initializeTransporter = async () => {
  const configs = createTransporterConfigs();
  
  for (let i = 0; i < configs.length; i++) {
    try {
      const testTransporter = nodemailer.createTransport(configs[i]);
      await testTransporter.verify();
      currentTransporter = testTransporter;
      transporterIndex = i;
      console.log(`✅ Email transporter initialized successfully with config ${i + 1}`);
      return true;
    } catch (error) {
      console.log(`❌ Email config ${i + 1} failed: ${error.message}`);
      if (i === configs.length - 1) {
        console.error('All email configurations failed');
        return false;
      }
    }
  }
  return false;
};

// Verify current transporter
const verifyTransporter = async () => {
  if (!currentTransporter) {
    return await initializeTransporter();
  }
  
  try {
    await currentTransporter.verify();
    return true;
  } catch (error) {
    console.error('Current transporter failed, trying to reinitialize...');
    return await initializeTransporter();
  }
};

// Enhanced retry logic with exponential backoff and connection verification
// Unified email sending function with Brevo primary and Gmail fallback
const sendEmailWithRetry = async (mailOptions, maxRetries = 3, baseDelay = 1000) => {
  // Try Brevo first
  try {
    console.log('Attempting to send email via Brevo...');
    
    const brevoEmailData = {
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      toName: mailOptions.toName || mailOptions.to
    };

    const brevoResult = await sendBrevoEmail(brevoEmailData);
    
    if (brevoResult.success) {
      emailDeliveryStats.sent++;
      emailDeliveryStats.lastSent = new Date();
      console.log('✅ Email sent successfully via Brevo:', brevoResult.messageId);
      return { 
        success: true, 
        messageId: brevoResult.messageId,
        attempts: 1,
        provider: 'brevo'
      };
    } else {
      console.log('❌ Brevo failed, falling back to Gmail:', brevoResult.error);
    }
  } catch (error) {
    console.log('❌ Brevo error, falling back to Gmail:', error.message);
  }

  // Fallback to Gmail if Brevo fails
  console.log('Falling back to Gmail SMTP...');
  
  // Verify Gmail connection before first attempt
  if (!await verifyTransporter()) {
    return {
      success: false,
      error: 'Both Brevo and Gmail email services failed - all configurations failed',
      attempts: 0,
      provider: 'none'
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gmail send attempt ${attempt}...`);
      
      const result = await currentTransporter.sendMail(mailOptions);
      emailDeliveryStats.sent++;
      emailDeliveryStats.lastSent = new Date();
      
      console.log(`✅ Email sent successfully via Gmail (attempt ${attempt}):`, result.messageId);
      return { 
        success: true, 
        messageId: result.messageId,
        attempts: attempt,
        provider: 'gmail',
        configUsed: transporterIndex + 1
      };
    } catch (error) {
      console.log(`Gmail send attempt ${attempt} failed:`, error.message);
      
      // Check for specific error types and try to reinitialize
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        console.error('Connection error detected, attempting to reinitialize transporter...');
        const reinitialized = await initializeTransporter();
        if (!reinitialized) {
          console.error('Failed to reinitialize transporter');
        }
      }
      
      // Track failed attempts
      if (attempt === maxRetries) {
        emailDeliveryStats.failed++;
        emailDeliveryStats.lastError = {
          message: error.message,
          timestamp: new Date(),
          recipient: mailOptions.to,
          errorCode: error.code,
          configUsed: transporterIndex + 1
        };
        
        return { 
          success: false, 
          error: error.message,
          attempts: attempt,
          errorCode: error.code,
          provider: 'gmail',
          configUsed: transporterIndex + 1
        };
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      emailDeliveryStats.retries++;
      
      console.log(`Retrying Gmail send in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Standardized error response format
const createErrorResponse = (error, context = '') => {
  const errorMessage = error.message || 'Unknown error occurred';
  console.error(`Email sending error${context ? ` (${context})` : ''}:`, error);
  
  return { 
    success: false, 
    error: errorMessage,
    context: context,
    timestamp: new Date().toISOString()
  };
};

// Standardized success response format
const createSuccessResponse = (messageId = null, context = '') => {
  return { 
    success: true, 
    messageId: messageId,
    context: context,
    timestamp: new Date().toISOString()
  };
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get email delivery statistics
export const getEmailStats = () => {
  return {
    ...emailDeliveryStats,
    successRate: emailDeliveryStats.sent / (emailDeliveryStats.sent + emailDeliveryStats.failed) * 100
  };
};

// Get current transporter status
export const getTransporterStatus = () => {
  return {
    isInitialized: !!currentTransporter,
    configIndex: transporterIndex,
    configName: currentTransporter ? `Config ${transporterIndex + 1}` : 'Not initialized',
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS
  };
};

// Send OTP email for signup
export const sendSignupOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Email Verification</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Verify Your Email Address</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              Thank you for signing up with UrbanSetu! To complete your registration, please use the verification code below:
            </p>
            
            <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'signup_otp') : 
      createErrorResponse(new Error(result.error), 'signup_otp');
  } catch (error) {
    return createErrorResponse(error, 'signup_otp');
  }
};

// Send OTP email for forgot password
export const sendForgotPasswordOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Reset Your Password</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              We received a request to reset your password for your UrbanSetu account. To proceed with the password reset, please use the verification code below:
            </p>
            
            <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            
            <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Important:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. For security reasons, please do not share this code with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'forgot_password_otp') : 
      createErrorResponse(new Error(result.error), 'forgot_password_otp');
  } catch (error) {
    return createErrorResponse(error, 'forgot_password_otp');
  }
};

// Send OTP email for profile email verification
export const sendProfileEmailOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Update Profile - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Profile Email Verification</p>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Verify Your New Email Address</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              You're updating your email address in your UrbanSetu profile. To confirm this change and verify your new email address, please use the verification code below:
            </p>
            
            <div style="background-color: #059669; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Important:</strong> This verification is required to update your profile email address. If you didn't initiate this change, please secure your account immediately.
            </p>
            
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. Once verified, your profile email will be updated to this address.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'profile_email_otp') : 
      createErrorResponse(new Error(result.error), 'profile_email_otp');
  } catch (error) {
    return createErrorResponse(error, 'profile_email_otp');
  }
};

// Send OTP email for login
export const sendLoginOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login Verification - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Login Verification</p>
          </div>
          
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #7c3aed;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Complete Your Login</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              You're signing in to your UrbanSetu account. To complete the login process, please use the verification code below:
            </p>
            
            <div style="background-color: #7c3aed; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Security Note:</strong> If you didn't request this login, please secure your account immediately by changing your password.
            </p>
            
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. For your security, please do not share this code with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'login_otp') : 
      createErrorResponse(new Error(result.error), 'login_otp');
  } catch (error) {
    return createErrorResponse(error, 'login_otp');
  }
};

// Send OTP email for account deletion confirmation
export const sendAccountDeletionOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirm Account Deletion - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Account Deletion Verification</p>
          </div>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Confirm Your Account Deletion</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              You requested to permanently delete your UrbanSetu account. To confirm this action, please use the verification code below:
            </p>
            <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Important:</strong> This action is irreversible. If you did not initiate this request, please ignore this email and secure your account.
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. Do not share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'account_deletion_otp') : 
      createErrorResponse(new Error(result.error), 'account_deletion_otp');
  } catch (error) {
    return createErrorResponse(error, 'account_deletion_otp');
  }
};

// Send OTP email for transfer rights (root admin only)
export const sendTransferRightsOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirm Transfer of Admin Rights - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Transfer Rights Verification</p>
          </div>
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Confirm Transfer of Admin Rights</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              You requested to transfer critical administrative rights. To confirm this high-privilege action, please use the verification code below:
            </p>
            <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Security Note:</strong> Only proceed if you initiated this operation. If not, contact support immediately.
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              This code will expire in 10 minutes. Do not share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'transfer_rights_otp') : 
      createErrorResponse(new Error(result.error), 'transfer_rights_otp');
  } catch (error) {
    return createErrorResponse(error, 'transfer_rights_otp');
  }
};

// Send new login notification email
export const sendNewLoginEmail = async (email, device, ip, location, loginTime) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'New Login Detected - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Security Alert</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">New Login Detected</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              We detected a new login to your UrbanSetu account. If this was you, no action is needed.
            </p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 5px 0; color: #374151;"><strong>Device:</strong> ${device}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>IP Address:</strong> ${ip}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> ${location || 'Unknown'}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Login Time:</strong> ${new Date(loginTime).toLocaleString('en-GB')}</p>
            </div>
            
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">
              If you didn't make this login, please secure your account immediately by changing your password.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'new_login_notification') : 
      createErrorResponse(new Error(result.error), 'new_login_notification');
  } catch (error) {
    return createErrorResponse(error, 'new_login_notification');
  }
};

// Send suspicious login alert email
export const sendSuspiciousLoginEmail = async (email, currentDevice, currentIp, currentLocation, previousDevice, previousIp, previousLocation) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Suspicious Login Attempt - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Security Alert</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">⚠️ Suspicious Login Detected</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              We detected a login from a new device or location that differs from your usual login pattern.
            </p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">Current Login:</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>Device:</strong> ${currentDevice}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>IP Address:</strong> ${currentIp}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> ${currentLocation || 'Unknown'}</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="color: #6b7280; margin: 0 0 10px 0; font-size: 16px;">Previous Login:</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>Device:</strong> ${previousDevice || 'Unknown'}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>IP Address:</strong> ${previousIp || 'Unknown'}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> ${previousLocation || 'Unknown'}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">
                If this wasn't you, please secure your account immediately by logging out all sessions and changing your password.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'suspicious_login_alert') : 
      createErrorResponse(new Error(result.error), 'suspicious_login_alert');
  } catch (error) {
    return createErrorResponse(error, 'suspicious_login_alert');
  }
};

// Send forced logout notification email
export const sendForcedLogoutEmail = async (email, reason, performedBy) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Security - Forced Logout - UrbanSetu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">UrbanSetu</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Security Notice</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Forced Logout</h2>
            <p style="color: #4b5563; margin: 0 0 15px 0; line-height: 1.6;">
              All your active sessions have been logged out for security reasons.
            </p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 5px 0; color: #374151;"><strong>Reason:</strong> ${reason}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Performed by:</strong> ${performedBy}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString('en-GB')}</p>
            </div>
            
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">
              You will need to log in again to access your account. If you have any concerns, please contact support.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const result = await sendEmailWithRetry(mailOptions);
    return result.success ? 
      createSuccessResponse(result.messageId, 'forced_logout_notification') : 
      createErrorResponse(new Error(result.error), 'forced_logout_notification');
  } catch (error) {
    return createErrorResponse(error, 'forced_logout_notification');
  }
};

// Payment Success Email
export const sendPaymentSuccessEmail = async (email, paymentDetails) => {
  try {
    const { 
      paymentId, 
      amount, 
      currency, 
      propertyName, 
      appointmentDate, 
      receiptUrl, 
      paymentType,
      gateway 
    } = paymentDetails;

    const subject = `Payment Successful - ${propertyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
              <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
              <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Payment Successful!</h1>
            <p style="color: #6b7280; margin: 10px 0 0; font-size: 16px;">Your payment has been processed successfully</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 20px;">Payment Details</h2>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Property:</span>
                <span style="color: #1f2937; font-weight: 600;">${propertyName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Appointment Date:</span>
                <span style="color: #1f2937; font-weight: 600;">${appointmentDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Payment Type:</span>
                <span style="color: #1f2937; font-weight: 600;">${paymentType.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Amount:</span>
                <span style="color: #1f2937; font-weight: 600;">${currency} ${amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-weight: 500;">Payment ID:</span>
                <span style="color: #1f2937; font-weight: 600;">${paymentId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280; font-weight: 500;">Payment Gateway:</span>
                <span style="color: #1f2937; font-weight: 600;">${gateway.toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: center;">
              <a href="${receiptUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; margin: 5px;">
                📄 Download Receipt
              </a>
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; margin: 5px;">
                📅 View Appointments
              </a>
            </div>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">What's Next?</h3>
            <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
              Your payment has been confirmed and your appointment is now secured. You can view all your appointments and download receipts from your appointments page.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              If you have any questions, please contact our support team.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
            <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending payment success email:', error);
    return createErrorResponse(error, 'payment_success_notification');
  }
};

// Payment Failed Email
export const sendPaymentFailedEmail = async (email, paymentDetails) => {
  try {
    const { 
      paymentId, 
      amount, 
      currency, 
      propertyName, 
      appointmentDate, 
      paymentType,
      gateway,
      reason 
    } = paymentDetails;

    const subject = `Payment Failed - ${propertyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3); position: relative;">
              <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; opacity: 0.2;"></div>
              <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✗</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Payment Failed</h1>
            <p style="color: #6b7280; margin: 10px 0 0; font-size: 16px;">We were unable to process your payment</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
            <h2 style="color: #dc2626; margin: 0 0 15px; font-size: 20px;">Payment Details</h2>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280; font-weight: 500;">Property:</span>
                <span style="color: #1f2937; font-weight: 600;">${propertyName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280; font-weight: 500;">Appointment Date:</span>
                <span style="color: #1f2937; font-weight: 600;">${appointmentDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280; font-weight: 500;">Payment Type:</span>
                <span style="color: #1f2937; font-weight: 600;">${paymentType.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280; font-weight: 500;">Amount:</span>
                <span style="color: #1f2937; font-weight: 600;">${currency} ${amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280; font-weight: 500;">Payment ID:</span>
                <span style="color: #1f2937; font-weight: 600;">${paymentId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280; font-weight: 500;">Payment Gateway:</span>
                <span style="color: #1f2937; font-weight: 600;">${gateway.toUpperCase()}</span>
              </div>
            </div>
            ${reason ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border-radius: 4px;">
                <strong style="color: #dc2626;">Reason:</strong>
                <span style="color: #7f1d1d; margin-left: 5px;">${reason}</span>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: center;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; margin: 5px;">
                🔄 Retry Payment
              </a>
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/about" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(107, 114, 128, 0.3); transition: all 0.3s ease; margin: 5px;">
                📞 Contact Support
              </a>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">What to do next?</h3>
            <ul style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
              <li>Check your payment method and try again</li>
              <li>Ensure you have sufficient funds</li>
              <li>Contact your bank if the issue persists</li>
              <li>Try using a different payment method</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              If you continue to experience issues, please contact our support team.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
            <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return createErrorResponse(error, 'payment_failed_notification');
  }
};

// Legacy function for backward compatibility (deprecated)
export const sendOTPEmail = async (email, otp) => {
  console.warn('sendOTPEmail is deprecated. Use sendSignupOTPEmail or sendForgotPasswordOTPEmail instead.');
  return await sendSignupOTPEmail(email, otp);
};

// Initialize email service and verify connection on startup
const initializeEmailService = async () => {
  console.log('🚀 Initializing email service...');
  
  // Initialize Brevo API service first (more reliable)
  console.log('📧 Initializing Brevo API service...');
  const brevoApiResult = initializeBrevoApiService();
  if (brevoApiResult.success) {
    console.log('✅ Brevo API service initialized successfully');
  } else {
    console.log('⚠️ Brevo API service initialization failed:', brevoApiResult.error);
  }

  // Initialize Brevo SMTP service as fallback
  console.log('📧 Initializing Brevo SMTP service...');
  const brevoSmtpResult = await initializeBrevoService();
  if (brevoSmtpResult.success) {
    console.log('✅ Brevo SMTP service initialized successfully');
  } else {
    console.log('⚠️ Brevo SMTP service initialization failed:', brevoSmtpResult.error);
  }
  
  // Check Gmail fallback environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Gmail fallback not configured: Missing EMAIL_USER or EMAIL_PASS environment variables');
    console.log('📧 Email service will use Brevo only');
  } else {
    console.log(`📧 Gmail fallback configured for: ${process.env.EMAIL_USER}`);
    
    // Try to initialize Gmail transporter as fallback
    const isGmailConnected = await initializeTransporter();
    if (isGmailConnected) {
      console.log(`✅ Gmail fallback initialized successfully with configuration ${transporterIndex + 1}`);
    } else {
      console.warn('⚠️ Gmail fallback initialization failed: All SMTP configurations failed');
    }
  }
  
  // Check if at least one service is available
  const brevoStatus = getBrevoStatus();
  const hasGmailFallback = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  
  if (brevoStatus.isInitialized || hasGmailFallback) {
    console.log('✅ Email service ready with at least one provider');
    return true;
  } else {
    console.error('❌ Email service initialization failed: No email providers available');
    console.error('💡 Please configure either:');
    console.error('   1. Brevo: BREVO_API_KEY environment variable');
    console.error('   2. Gmail: EMAIL_USER and EMAIL_PASS environment variables');
    return false;
  }
};

// Password Change Email Functions
export const sendPasswordResetSuccessEmail = async (userEmail, userName, resetMethod = 'forgot_password') => {
  const emailData = {
    to: userEmail,
    subject: "🔒 Password Successfully Reset - UrbanSetu",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔒 Password Reset Successful</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Your account security has been updated</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Password Successfully Reset</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${userName}, your password has been successfully reset and your account is now secure.</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Reset Details</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Account:</span>
                  <span style="color: #1f2937; font-weight: 600;">${userEmail}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Reset Method:</span>
                  <span style="color: #1f2937; font-weight: 600;">${resetMethod === 'forgot_password' ? 'Forgot Password' : 'Manual Reset'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Reset Time:</span>
                  <span style="color: #1f2937; font-weight: 600;">${new Date().toLocaleString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}</span>
                </div>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 10px;">⚠️</span>
                <h4 style="color: #92400e; margin: 0; font-size: 16px; font-weight: 600;">Security Notice</h4>
              </div>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                If you did not request this password reset, please contact our support team immediately. 
                Your account security is our top priority.
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/signin" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                Sign In to Your Account
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 15px; font-size: 14px;">
              This email was sent to ${userEmail} because a password reset was requested for your UrbanSetu account.
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailWithRetry(emailData);
    console.log(`✅ Password reset success email sent to: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset success email to ${userEmail}:`, error);
    throw error;
  }
};

export const sendPasswordChangeSuccessEmail = async (userEmail, userName, changeMethod = 'manual_change') => {
  const emailData = {
    to: userEmail,
    subject: "🔒 Password Successfully Changed - UrbanSetu",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Change Successful</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🔒 Password Changed Successfully</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Your account security has been updated</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Password Successfully Changed</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${userName}, your password has been successfully changed and your account remains secure.</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Change Details</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Account:</span>
                  <span style="color: #1f2937; font-weight: 600;">${userEmail}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Change Method:</span>
                  <span style="color: #1f2937; font-weight: 600;">${changeMethod === 'manual_change' ? 'Manual Change' : 'Profile Update'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Change Time:</span>
                  <span style="color: #1f2937; font-weight: 600;">${new Date().toLocaleString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}</span>
                </div>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 10px;">⚠️</span>
                <h4 style="color: #92400e; margin: 0; font-size: 16px; font-weight: 600;">Security Notice</h4>
              </div>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                If you did not make this password change, please contact our support team immediately. 
                Your account security is our top priority.
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/signin" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                Sign In to Your Account
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 15px; font-size: 14px;">
              This email was sent to ${userEmail} because a password change was made to your UrbanSetu account.
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailWithRetry(emailData);
    console.log(`✅ Password change success email sent to: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send password change success email to ${userEmail}:`, error);
    throw error;
  }
};

// Welcome Email for New Account
export const sendWelcomeEmail = async (email, userDetails) => {
  try {
    const { 
      username, 
      role, 
      mobileNumber, 
      address,
      adminApprovalStatus 
    } = userDetails;

    const subject = `Welcome to UrbanSetu, ${username}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to UrbanSetu!</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Your account has been successfully created</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Account Created Successfully!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, welcome to UrbanSetu! Your account has been successfully created and you're ready to start your real estate journey.</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Full Name:</span>
                  <span style="color: #1f2937; font-weight: 600;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Mobile Number:</span>
                  <span style="color: #1f2937; font-weight: 600;">${mobileNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600;">${role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
                ${address ? `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Address:</span>
                    <span style="color: #1f2937; font-weight: 600;">${address}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            ${role === 'admin' ? `
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">Admin Account Status</h3>
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                  Your admin account has been created and is currently pending approval. An existing administrator will review and approve your account. You'll receive a notification email once your account is approved.
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: center;">
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; margin: 5px;">
                  🔑 Sign In to Your Account
                </a>
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/search" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; margin: 5px;">
                  🏠 Browse Properties
                </a>
              </div>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">What's Next?</h3>
              <ul style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                <li>Sign in to your account to access all features</li>
                <li>Complete your profile with additional information</li>
                <li>Browse and search for properties that match your needs</li>
                <li>${role === 'admin' ? 'Wait for admin approval to access administrative features' : 'Start your real estate journey with us'}</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact our support team.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return createErrorResponse(error, 'welcome_email');
  }
};

// Auto-initialize email service
initializeEmailService().catch(error => {
  console.error('Email service auto-initialization failed:', error);
});

// Account Deletion Email with Revocation Link
export const sendAccountDeletionEmail = async (email, userDetails, revocationLink) => {
  try {
    const { username, role } = userDetails;

    const subject = `Account Deleted - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deleted - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Account Deleted</h1>
            <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">Your UrbanSetu account has been successfully deleted</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Account Successfully Deleted</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Your account has been successfully deleted from UrbanSetu. We appreciate the time you spent with us and hope to serve you again in the future.</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600;">${role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
              <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">🔄 Change Your Mind?</h3>
              <p style="color: #92400e; margin: 0 0 15px; font-size: 14px; line-height: 1.5;">
                If you change your mind within the next 30 days, you can restore your account by clicking the link below. This will reactivate your account with all your previous data intact.
              </p>
              <div style="text-align: center;">
                <a href="${revocationLink}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3); transition: all 0.3s ease;">
                  🔄 Restore My Account
                </a>
              </div>
              <p style="color: #92400e; margin: 15px 0 0; font-size: 12px; text-align: center;">
                This link will expire in 30 days
              </p>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">What Happens Next?</h3>
              <ul style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                <li>Your account data has been moved to our deleted accounts archive</li>
                <li>You can restore your account within 30 days using the link above</li>
                <li>After 30 days, your account will be permanently deleted</li>
                <li>You can create a new account anytime by visiting our signup page</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for being part of the UrbanSetu community. We value your time with us and look forward to the opportunity to serve you again.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending account deletion email:', error);
    return createErrorResponse(error, 'account_deletion_email');
  }
};

// Account Activation Email
export const sendAccountActivationEmail = async (email, userDetails) => {
  try {
    const { username, role } = userDetails;

    const subject = `Account Restored - Welcome Back to UrbanSetu!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Restored - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome Back!</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Your UrbanSetu account has been successfully restored</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Account Restored Successfully!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, your account has been successfully restored with all your previous data intact!</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600;">${role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: center;">
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; margin: 5px;">
                  🔑 Sign In to Your Account
                </a>
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/search" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; margin: 5px;">
                  🏠 Browse Properties
                </a>
              </div>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">What's Next?</h3>
              <ul style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                <li>Sign in to your account to access all your previous data</li>
                <li>Your profile, preferences, and settings have been restored</li>
                <li>Continue browsing and searching for properties</li>
                <li>${role === 'admin' ? 'Access your administrative features' : 'Enjoy all the features as before'}</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Welcome back to UrbanSetu! We're glad you decided to return.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending account activation email:', error);
    return createErrorResponse(error, 'account_activation_email');
  }
};

// Appointment Reminder Email
export const sendAppointmentReminderEmail = async (email, appointmentDetails, userRole) => {
  try {
    const { 
      propertyName, 
      propertyDescription, 
      date, 
      time, 
      buyerName, 
      buyerEmail, 
      sellerName, 
      sellerEmail, 
      purpose,
      listingId
    } = appointmentDetails;

    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const isBuyer = userRole === 'buyer';
    const otherPartyName = isBuyer ? sellerName : buyerName;
    const otherPartyEmail = isBuyer ? sellerEmail : buyerEmail;
    
    const subject = `Appointment Reminder - ${propertyName} - Tomorrow at ${time}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">⏰ Appointment Reminder</h1>
            <p style="color: #fef3c7; margin: 10px 0 0; font-size: 16px;">Your appointment is tomorrow!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">⏰</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Appointment Tomorrow!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder about your upcoming property ${isBuyer ? 'viewing' : 'showing'} appointment.
              </p>
            </div>
            
            <!-- Appointment Details -->
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Appointment Details</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Property:</span>
                  <span style="color: #1f2937; font-weight: 600;">${propertyName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Date:</span>
                  <span style="color: #1f2937; font-weight: 600;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Time:</span>
                  <span style="color: #1f2937; font-weight: 600;">${time}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Purpose:</span>
                  <span style="color: #1f2937; font-weight: 600;">${purpose === 'buy' ? 'Purchase' : 'Rental'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Your Role:</span>
                  <span style="color: #1f2937; font-weight: 600;">${isBuyer ? 'Buyer' : 'Seller'}</span>
                </div>
              </div>
            </div>

            <!-- Property Description -->
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">Property Description</h3>
              <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">${propertyDescription}</p>
            </div>

            <!-- Contact Information -->
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
              <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px;">Contact Information</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #047857; font-weight: 500;">${isBuyer ? 'Seller' : 'Buyer'}:</span>
                  <span style="color: #065f46; font-weight: 600;">${otherPartyName}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #047857; font-weight: 500;">Email:</span>
                  <span style="color: #065f46; font-weight: 600;">${otherPartyEmail}</span>
                </div>
              </div>
            </div>

            <!-- Important Notes -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
              <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">Important Reminders</h3>
              <ul style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                <li>Please arrive on time for your appointment</li>
                <li>Bring a valid ID for verification</li>
                <li>If you need to reschedule, contact the ${isBuyer ? 'seller' : 'buyer'} as soon as possible</li>
                <li>Check the property listing for any specific requirements or instructions</li>
                <li>If you have any questions, use the chat feature in your appointment</li>
              </ul>
            </div>
            
            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/myappointments" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); margin: 5px;">
                View Appointment Details
              </a>
              ${listingId ? `
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); margin: 5px;">
                  View Property Listing
                </a>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated reminder. Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
`;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    return createErrorResponse(error, 'appointment_reminder_email');
  }
};

// Price Drop Alert Email
export const sendPriceDropAlertEmail = async (email, priceDropDetails) => {
  try {
    const { 
      propertyName, 
      propertyDescription, 
      propertyImage,
      originalPrice, 
      currentPrice, 
      dropAmount, 
      dropPercentage,
      propertyType,
      propertyLocation,
      listingId,
      watchlistDate
    } = priceDropDetails;

    const subject = `💰 Price Drop Alert - ${propertyName} - Save ₹${dropAmount.toLocaleString()}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Price Drop Alert - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💰 Price Drop Alert!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0; font-size: 16px;">Great news! A property you're watching has dropped in price</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">💰</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Price Dropped!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">
                The property you're watching has dropped in price. Don't miss this opportunity!
              </p>
            </div>
            
            <!-- Property Image -->
            ${propertyImage ? `
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${propertyImage}" alt="${propertyName}" style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
            
            <!-- Property Details -->
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Property Details</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Property Name:</span>
                  <span style="color: #1f2937; font-weight: 600;">${propertyName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Type:</span>
                  <span style="color: #1f2937; font-weight: 600;">${propertyType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Location:</span>
                  <span style="color: #1f2937; font-weight: 600;">${propertyLocation}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Added to Watchlist:</span>
                  <span style="color: #1f2937; font-weight: 600;">${new Date(watchlistDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <!-- Price Drop Details -->
            <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 30px;">
              <h3 style="color: #065f46; margin: 0 0 15px; font-size: 18px; font-weight: 600;">💰 Price Drop Details</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #047857; font-weight: 500;">Original Price:</span>
                  <span style="color: #065f46; font-weight: 600; text-decoration: line-through;">₹${originalPrice.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #047857; font-weight: 500;">Current Price:</span>
                  <span style="color: #065f46; font-weight: 600; font-size: 18px;">₹${currentPrice.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #047857; font-weight: 500;">You Save:</span>
                  <span style="color: #10b981; font-weight: 700; font-size: 18px;">₹${dropAmount.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="color: #047857; font-weight: 500;">Drop Percentage:</span>
                  <span style="color: #10b981; font-weight: 700; font-size: 18px;">${dropPercentage}%</span>
                </div>
              </div>
            </div>

            <!-- Property Description -->
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px;">Property Description</h3>
              <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">${propertyDescription}</p>
            </div>

            <!-- Urgency Message -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
              <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">⚡ Act Fast!</h3>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                Price drops like this don't last long! Other buyers might be interested too. 
                Don't miss out on this great opportunity to save money on your dream property.
              </p>
            </div>
            
            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); margin: 5px;">
                View Property Details
              </a>
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/watchlist" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); margin: 5px;">
                Go to Watchlist
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated price drop alert. You can manage your watchlist preferences in your account settings.
              </p>
              <p style="color: #9ca3af; margin: 15px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
`;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending price drop alert email:', error);
    return createErrorResponse(error, 'price_drop_alert_email');
  }
};

// 15-Day Account Deletion Reminder Email
export const sendAccountDeletionReminderEmail = async (email, userDetails, revocationLink, daysLeft) => {
  try {
    const { username, role } = userDetails;

    const subject = `Reminder: Restore Your UrbanSetu Account (${daysLeft} days left)`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Restoration Reminder - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Account Restoration Reminder</h1>
            <p style="color: #fef3c7; margin: 10px 0 0; font-size: 16px;">You still have ${daysLeft} days to restore your account</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">⏰</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Don't Lose Your Account!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, you still have <strong style="color: #f59e0b;">${daysLeft} days</strong> to restore your UrbanSetu account before it's permanently deleted.</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">⚠️ Important Notice</h3>
              <p style="color: #92400e; margin: 0 0 10px; font-size: 14px; line-height: 1.6;">
                After ${daysLeft} days, your account and all associated data will be permanently removed, including:
              </p>
              <ul style="color: #92400e; margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Your property wishlist and watchlist</li>
                <li>All your reviews and ratings</li>
                <li>Appointment history and messages</li>
                <li>Account preferences and settings</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${revocationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                Restore My Account Now
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">If you don't want to restore your account, you can ignore this email.</p>
              <p style="margin: 0;">This is an automated reminder. Please do not reply to this email.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending account deletion reminder email:', error);
    return createErrorResponse(error, 'account_deletion_reminder_email');
  }
};

// Final Account Deletion Warning Email (1-2 days before purge)
export const sendAccountDeletionFinalWarningEmail = async (email, userDetails, revocationLink, daysLeft) => {
  try {
    const { username, role } = userDetails;

    const subject = `FINAL WARNING: Your UrbanSetu Account Will Be Deleted in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Final Warning - Account Deletion - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">FINAL WARNING</h1>
            <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">Your account will be permanently deleted in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3); position: relative;">
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 50%; opacity: 0.2;"></div>
                <span style="color: #ffffff; font-size: 36px; font-weight: bold; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🚨</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Last Chance to Restore Your Account!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, this is your <strong style="color: #dc2626;">FINAL WARNING</strong>. Your UrbanSetu account will be permanently deleted in <strong style="color: #dc2626;">${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>!</p>
            </div>
            
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">⚠️ URGENT: Data Will Be Lost Forever</h3>
              <p style="color: #991b1b; margin: 0 0 10px; font-size: 14px; line-height: 1.6;">
                After ${daysLeft} day${daysLeft === 1 ? '' : 's'}, the following data will be permanently deleted and cannot be recovered:
              </p>
              <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li><strong>Property Wishlist & Watchlist</strong> - All your saved properties</li>
                <li><strong>Reviews & Ratings</strong> - All your property reviews</li>
                <li><strong>Appointment History</strong> - All your booking records</li>
                <li><strong>Messages & Conversations</strong> - All chat history</li>
                <li><strong>Account Settings</strong> - All preferences and configurations</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${revocationLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 18px 35px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                RESTORE ACCOUNT NOW
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px; font-weight: 600; color: #dc2626;">This is your last chance to restore your account!</p>
              <p style="margin: 0;">If you don't restore your account now, it will be permanently deleted and cannot be recovered.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending account deletion final warning email:', error);
    return createErrorResponse(error, 'account_deletion_final_warning_email');
  }
};

/**
 * Send admin approval email to newly approved admin
 */
export const sendAdminApprovalEmail = async (email, adminDetails) => {
  try {
    const { username, role, approvedBy, approvedAt } = adminDetails;

    const subject = `🎉 Welcome! Your Admin Account Has Been Approved - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Approved - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Congratulations!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0; font-size: 16px;">Your admin account has been approved</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Welcome to the Admin Team!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, your admin account has been successfully approved. You can now access all admin features and manage the platform.</p>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🚀 What's Next?</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Sign in to your account using your existing credentials</li>
                <li>Access the admin dashboard to manage users and content</li>
                <li>Review and approve pending admin requests</li>
                <li>Monitor platform activity and user management</li>
                <li>Access advanced reporting and analytics tools</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                Sign In to Admin Dashboard
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${role}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Approved On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(approvedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p style="margin: 0;">Welcome to the UrbanSetu admin team!</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending admin approval email:', error);
    return createErrorResponse(error, 'admin_approval_email');
  }
};

/**
 * Send admin rejection email to rejected admin
 */
export const sendAdminRejectionEmail = async (email, adminDetails) => {
  try {
    const { username, role, rejectedBy, rejectedAt } = adminDetails;

    const subject = `❌ Admin Account Request Update - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Request Update - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Account Request Update</h1>
            <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">Your admin account request has been reviewed</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">✕</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Request Not Approved</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, we regret to inform you that your admin account request has not been approved at this time.</p>
            </div>
            
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 What This Means</h3>
              <ul style="color: #991b1b; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Your account remains as a regular user account</li>
                <li>You can still use all standard platform features</li>
                <li>You can browse, buy, and sell properties normally</li>
                <li>You can reapply for admin privileges in the future</li>
                <li>Your account data and preferences are preserved</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                Continue Using UrbanSetu
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Current Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">User</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Reviewed On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(rejectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">If you have any questions about this decision or would like to discuss your application further, please contact our support team.</p>
              <p style="margin: 0;">Thank you for your interest in contributing to UrbanSetu!</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending admin rejection email:', error);
    return createErrorResponse(error, 'admin_rejection_email');
  }
};

/**
 * Send account suspension email to suspended user/admin
 */
export const sendAccountSuspensionEmail = async (email, suspensionDetails) => {
  try {
    const { username, role, reason, suspendedBy, suspendedAt, isSuspension } = suspensionDetails;

    const subject = isSuspension 
      ? `⚠️ Account Suspended - UrbanSetu` 
      : `✅ Account Reactivated - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isSuspension ? 'Account Suspended' : 'Account Reactivated'} - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${isSuspension ? '#ef4444 0%, #dc2626 100%' : '#10b981 0%, #059669 100%'}); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${isSuspension ? '⚠️ Account Suspended' : '✅ Account Reactivated'}</h1>
            <p style="color: ${isSuspension ? '#fecaca' : '#d1fae5'}; margin: 10px 0 0; font-size: 16px;">${isSuspension ? 'Your account has been temporarily suspended' : 'Your account has been reactivated'}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${isSuspension ? '#ef4444, #dc2626' : '#10b981, #059669'}); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(${isSuspension ? '239, 68, 68' : '16, 185, 129'}, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">${isSuspension ? '⚠️' : '✓'}</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">${isSuspension ? 'Account Access Restricted' : 'Welcome Back!'}</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, ${isSuspension ? 'your UrbanSetu account has been suspended due to a policy violation.' : 'your UrbanSetu account has been reactivated and you can now access all features again.'}</p>
            </div>
            
            ${isSuspension ? `
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 Suspension Details</h3>
              <div style="color: #991b1b; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 10px;"><strong>Reason:</strong> ${reason || 'Policy violation'}</p>
                <p style="margin: 0 0 10px;"><strong>Suspended On:</strong> ${new Date(suspendedAt).toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Suspended By:</strong> ${suspendedBy || 'Administrator'}</p>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🔄 What This Means</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>You cannot sign in to your account</li>
                <li>You cannot access any UrbanSetu features</li>
                <li>Your account data is preserved</li>
                <li>You can appeal this decision by contacting support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                Contact Support to Appeal
              </a>
            </div>
            ` : `
            <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🎉 Account Restored</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>You can now sign in to your account</li>
                <li>All UrbanSetu features are available</li>
                <li>Your account data is fully restored</li>
                <li>You can continue using the platform normally</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                Sign In to Your Account
              </a>
            </div>
            `}
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${role}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">${isSuspension ? 'Suspended On:' : 'Reactivated On:'}</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(suspendedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">${isSuspension ? 'If you believe this suspension is a mistake, please contact our support team immediately.' : 'Thank you for your patience. We look forward to serving you again.'}</p>
              <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending account suspension email:', error);
    return createErrorResponse(error, 'account_suspension_email');
  }
};

/**
 * Send user promotion email to newly promoted admin
 */
export const sendUserPromotionEmail = async (email, promotionDetails) => {
  try {
    const { username, promotedBy, promotedAt } = promotionDetails;

    const subject = `🎉 Congratulations! You've Been Promoted to Admin - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Promoted to Admin - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Congratulations!</h1>
            <p style="color: #e9d5ff; margin: 10px 0 0; font-size: 16px;">You've been promoted to Admin</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">👑</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Welcome to the Admin Team!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, congratulations! You have been promoted to Admin and now have administrative privileges on UrbanSetu.</p>
            </div>
            
            <div style="background-color: #faf5ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #8b5cf6;">
              <h3 style="color: #6b21a8; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🚀 New Admin Privileges</h3>
              <ul style="color: #6b21a8; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Manage user accounts and permissions</li>
                <li>Review and moderate property listings</li>
                <li>Handle user reports and disputes</li>
                <li>Access admin dashboard and analytics</li>
                <li>Approve or reject admin requests</li>
                <li>Monitor platform activity and security</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
                Access Admin Dashboard
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">New Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">Admin</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Promoted On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(promotedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">You will need to sign in again to access your new admin privileges.</p>
              <p style="margin: 0;">Welcome to the UrbanSetu admin team!</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending user promotion email:', error);
    return createErrorResponse(error, 'user_promotion_email');
  }
};

/**
 * Send manual softban email to user/admin
 */
export const sendManualSoftbanEmail = async (email, softbanDetails) => {
  try {
    const { username, role, reason, softbannedBy, softbannedAt, revocationLink } = softbanDetails;

    const subject = `⚠️ Account Softbanned - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Softbanned - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">⚠️ Account Softbanned</h1>
            <p style="color: #fef3c7; margin: 10px 0 0; font-size: 16px;">Your UrbanSetu account has been temporarily suspended</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">⚠️</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Account Temporarily Suspended</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, your UrbanSetu account has been softbanned by an administrator. This is a temporary suspension that can be restored within 30 days.</p>
            </div>
            
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 Softban Details</h3>
              <div style="color: #991b1b; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 10px;"><strong>Reason:</strong> ${reason || 'Policy violation'}</p>
                <p style="margin: 0 0 10px;"><strong>Softbanned On:</strong> ${new Date(softbannedAt).toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Softbanned By:</strong> Administrator</p>
              </div>
            </div>

            <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🔄 What This Means</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>You cannot sign in to your account</li>
                <li>You cannot access any UrbanSetu features</li>
                <li>Your account data is preserved</li>
                <li>You cannot restore your account yourself</li>
                <li>You must contact support to appeal this decision</li>
                <li>After 30 days, your account will be permanently deleted</li>
              </ul>
            </div>

            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📞 Contact Support to Appeal</h3>
              <p style="color: #991b1b; margin: 0 0 15px; font-size: 14px; line-height: 1.6;">Since your account was softbanned by an administrator, you cannot restore it yourself. If you believe this action was taken in error or wish to appeal this decision, please contact our support team immediately.</p>
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.3s ease;">
                  Contact Support for Appeal
                </a>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Softbanned On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(softbannedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">To appeal this decision or if you have any questions, please contact our support team using the button above.</p>
              <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending manual softban email:', error);
    return createErrorResponse(error, 'manual_softban_email');
  }
};

/**
 * Send manual account restoration email (admin-initiated)
 */
export const sendManualAccountRestorationEmail = async (email, restorationDetails) => {
  try {
    const { username, role, restoredBy, restoredAt } = restorationDetails;

    const subject = `✅ Account Restored by Administrator - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Restored by Administrator - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">✅ Account Restored</h1>
            <p style="color: #d1fae5; margin: 10px 0 0; font-size: 16px;">Your UrbanSetu account has been restored by an administrator</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">✓</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Account Successfully Restored</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, your UrbanSetu account has been restored by an administrator and you can now access all features again.</p>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🎉 Account Restored by Administrator</h3>
              <div style="color: #166534; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 10px;"><strong>Restored On:</strong> ${new Date(restoredAt).toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Restored By:</strong> Administrator</p>
              </div>
            </div>

            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🔄 What This Means</h3>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>You can now sign in to your account</li>
                <li>All UrbanSetu features are available</li>
                <li>Your account data is fully restored</li>
                <li>You can continue using the platform normally</li>
                <li>Your previous settings and preferences are preserved</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                Sign In to Your Account
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Restored On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(restoredAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">Thank you for your patience. We look forward to serving you again.</p>
              <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending manual account restoration email:', error);
    return createErrorResponse(error, 'manual_account_restoration_email');
  }
};

/**
 * Send admin demotion email to demoted user
 */
export const sendAdminDemotionEmail = async (email, demotionDetails) => {
  try {
    const { username, demotedBy, demotedAt, reason } = demotionDetails;

    const subject = `📋 Admin Access Revoked - UrbanSetu`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Access Revoked - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">📋 Access Update</h1>
            <p style="color: #d1d5db; margin: 10px 0 0; font-size: 16px;">Your admin privileges have been revoked</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6b7280, #4b5563); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(107, 114, 128, 0.3);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">👤</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Admin Access Revoked</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello ${username}, your admin privileges have been revoked and you are now a regular user on UrbanSetu.</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #6b7280;">
              <h3 style="color: #374151; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 What This Means</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>You no longer have admin privileges</li>
                <li>You cannot access the admin dashboard</li>
                <li>You cannot manage other users or content</li>
                <li>You can still use all regular user features</li>
                <li>You can browse, buy, and sell properties normally</li>
                <li>Your account data and preferences are preserved</li>
              </ul>
            </div>

            ${reason ? `
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📝 Reason for Demotion</h3>
              <div style="color: #991b1b; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/sign-in" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                Continue Using UrbanSetu
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Account Details</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Username:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${username}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Email:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Current Role:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">User</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span style="color: #6b7280; font-weight: 500; font-size: 14px;">Demoted On:</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${new Date(demotedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">If you have any questions about this change, please contact our support team.</p>
              <p style="margin: 0;">Thank you for your previous contributions to UrbanSetu!</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending admin demotion email:', error);
    return createErrorResponse(error, 'admin_demotion_email');
  }
};

// Send outdated appointment email
export const sendOutdatedAppointmentEmail = async (email, appointmentDetails, userRole) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName, 
      buyerEmail, 
      sellerName, 
      sellerEmail, 
      purpose,
      listingId,
      message
    } = appointmentDetails;

    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const isBuyer = userRole === 'buyer';
    const otherPartyName = isBuyer ? sellerName : buyerName;
    const otherPartyEmail = isBuyer ? sellerEmail : buyerEmail;
    const userName = isBuyer ? buyerName : sellerName;
    
    const subject = `Appointment Expired - ${propertyName} - Book New Appointment`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Expired - UrbanSetu</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">⏰ Appointment Expired</h1>
            <p style="color: #fecaca; margin: 10px 0 0; font-size: 16px;">Your appointment has passed - Book a new one!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);">
                <span style="color: #ffffff; font-size: 32px;">📅</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 700;">Hello ${userName}!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Your appointment for <strong>${propertyName}</strong> has expired and is no longer valid.</p>
            </div>
            
            <!-- Property Details -->
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">🏠 Property Details</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #64748b; font-size: 18px;">🏷️</span>
                  <div>
                    <div style="color: #1e293b; font-weight: 600; font-size: 16px;">${propertyName}</div>
                    <div style="color: #64748b; font-size: 14px;">${propertyAddress}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #64748b; font-size: 18px;">💰</span>
                  <div>
                    <div style="color: #1e293b; font-weight: 600; font-size: 16px;">₹${propertyPrice?.toLocaleString() || 'Price not available'}</div>
                    <div style="color: #64748b; font-size: 14px;">${purpose === 'buy' ? 'For Sale' : 'For Rent'}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="color: #64748b; font-size: 18px;">📝</span>
                  <div>
                    <div style="color: #1e293b; font-weight: 600; font-size: 16px;">Description</div>
                    <div style="color: #64748b; font-size: 14px; line-height: 1.5;">${propertyDescription}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Expired Appointment Details -->
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; margin: 0 0 20px; font-size: 18px; font-weight: 600;">❌ Expired Appointment</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                  <span style="color: #991b1b; font-weight: 500; font-size: 14px;">Date:</span>
                  <span style="color: #991b1b; font-weight: 600; font-size: 14px;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                  <span style="color: #991b1b; font-weight: 500; font-size: 14px;">Time:</span>
                  <span style="color: #991b1b; font-weight: 600; font-size: 14px;">${time}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                  <span style="color: #991b1b; font-weight: 500; font-size: 14px;">Status:</span>
                  <span style="color: #991b1b; font-weight: 600; font-size: 14px;">Expired</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #991b1b; font-weight: 500; font-size: 14px;">Other Party:</span>
                  <span style="color: #991b1b; font-weight: 600; font-size: 14px;">${otherPartyName}</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: flex; flex-direction: column; gap: 15px; align-items: center; max-width: 100%;">
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; min-width: 200px; text-align: center; word-wrap: break-word;">
                  🏠 View Property Details
                </a>
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/my-appointments" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; min-width: 200px; text-align: center; word-wrap: break-word;">
                  📅 My Appointments
                </a>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🚀 What's Next?</h3>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Visit the property page to book a new appointment</li>
                <li>Choose a new date and time that works for both parties</li>
                <li>Contact the ${isBuyer ? 'seller' : 'buyer'} directly if needed</li>
                <li>Check your appointments page for all scheduled meetings</li>
              </ul>
            </div>
            
            <!-- Thank You Message -->
            <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 18px; font-weight: 600;">Thank You for Using UrbanSetu!</h3>
              <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                We appreciate your business and look forward to helping you find your perfect property. 
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
            
            <!-- Contact Information -->
            <div style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 10px;">
                <strong>Need Help?</strong> Contact us at 
                <a href="mailto:support@urbansetu.com" style="color: #3b82f6; text-decoration: none;">support@urbansetu.com</a>
              </p>
              <p style="margin: 0;">
                Visit our website: 
                <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}" style="color: #3b82f6; text-decoration: none;">UrbanSetu.com</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} UrbanSetu. All rights reserved. | 
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a> | 
              <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending outdated appointment email:', error);
    return createErrorResponse(error, 'outdated_appointment_email');
  }
};

// Appointment Booking Confirmation Email
export const sendAppointmentBookingEmail = async (email, appointmentDetails, userRole) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName, 
      buyerEmail, 
      sellerName, 
      sellerEmail,
      purpose,
      message,
      listingId,
      paymentStatus
    } = appointmentDetails;

    const subject = `🏠 Appointment Booked - ${propertyName} | UrbanSetu`;
    
    const isBuyer = userRole === 'buyer';
    const isSeller = userRole === 'seller';
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Booked - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-pending {
          background: #fef3c7;
          color: #d97706;
        }
        .status-paid {
          background: #d1fae5;
          color: #059669;
        }
        .message-section {
          background: #f1f5f9;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .message-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .message-text {
          color: #1f2937;
          font-style: italic;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn-outline {
          background: white;
          color: #3b82f6 !important;
          border: 2px solid #3b82f6;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Appointment Booked Successfully!</h1>
          <p>Your property viewing appointment has been confirmed</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 ${isBuyer ? 'Seller' : 'Buyer'}:</span>
                <span class="detail-value">${isBuyer ? sellerName : buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Appointment Status:</span>
                <span class="detail-value">
                  <span class="status-badge status-pending">
                    ⏳ Pending
                  </span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Message from ${isBuyer ? 'you' : 'buyer'}:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
            ${isBuyer && paymentStatus !== 'paid' ? `
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-outline">
              💳 Make Payment
            </a>
            ` : ''}
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              ${isBuyer ? `
              <li>Wait for the seller to accept or decline your appointment request</li>
              <li>You will receive an email notification once the seller responds</li>
              ${paymentStatus !== 'paid' ? '<li>Complete your payment to secure the appointment</li>' : ''}
              <li>Prepare any questions you have about the property</li>
              <li>Arrive on time for your scheduled appointment</li>
              ` : `
              <li>Review the appointment request and respond (accept/decline)</li>
              <li>You will receive an email notification when the buyer makes payment</li>
              <li>Prepare the property for viewing</li>
              <li>Be available at the scheduled time</li>
              `}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>Thank you for using our platform for your property needs!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment booking email:', error);
    return createErrorResponse(error, 'appointment_booking_email');
  }
};

// Seller Payment Notification Email (when buyer makes payment)
export const sendSellerPaymentNotificationEmail = async (email, paymentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName, 
      paymentAmount,
      paymentCurrency,
      paymentGateway,
      listingId
    } = paymentDetails;

    const subject = `💰 Payment Received - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .payment-card {
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .payment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .payment-amount {
          font-size: 24px;
          font-weight: 700;
          color: #059669;
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 2px solid #bbf7d0;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #d1fae5;
          color: #059669;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Received!</h1>
          <p>Your appointment payment has been confirmed</p>
        </div>
        
        <div class="content">
          <div class="payment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="payment-amount">
              Payment Received: ${paymentCurrency} ${paymentAmount}
            </div>
            
            <div class="payment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Appointment Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Appointment Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Buyer:</span>
                <span class="detail-value">${buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💳 Payment Gateway:</span>
                <span class="detail-value">${paymentGateway}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">✅ Payment Status:</span>
                <span class="detail-value">
                  <span class="status-badge">PAID</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              <li>Your appointment is now confirmed and secured</li>
              <li>Prepare the property for viewing</li>
              <li>Be available at the scheduled appointment time</li>
              <li>You can communicate with the buyer through the appointment chat</li>
              <li>After the appointment, you can provide feedback and ratings</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>Thank you for using our platform for your property needs!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending seller payment notification email:', error);
    return createErrorResponse(error, 'seller_payment_notification_email');
  }
};

// Appointment Rejected Email (to buyer)
export const sendAppointmentRejectedEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      sellerName,
      purpose,
      message,
      listingId,
      rejectionReason
    } = appointmentDetails;

    const subject = `❌ Appointment Rejected - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Rejected - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #fecaca;
          color: #dc2626;
        }
        .rejection-reason {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .rejection-reason h3 {
          color: #dc2626;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .rejection-reason p {
          color: #7f1d1d;
          margin: 0;
          font-style: italic;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Appointment Rejected</h1>
          <p>Unfortunately, your appointment request was not accepted</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Seller:</span>
                <span class="detail-value">${sellerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">REJECTED</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Your Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            ${rejectionReason ? `
            <div class="rejection-reason">
              <h3>📝 Rejection Reason:</h3>
              <p>"${rejectionReason}"</p>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 What's Next:</h3>
            <ul>
              <li>Don't worry! You can explore other similar properties</li>
              <li>Use our search filters to find properties that match your criteria</li>
              <li>Consider reaching out to other sellers for similar properties</li>
              <li>You can book new appointments anytime</li>
              <li>Check our recommendations for properties you might like</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>Keep exploring to find your perfect property!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment rejected email:', error);
    return createErrorResponse(error, 'appointment_rejected_email');
  }
};

// Appointment Accepted Email (to buyer)
export const sendAppointmentAcceptedEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      sellerName,
      purpose,
      message,
      listingId
    } = appointmentDetails;

    const subject = `✅ Appointment Accepted - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Accepted - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #d1fae5;
          color: #059669;
        }
        .message-section {
          background: #f1f5f9;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .message-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .message-text {
          color: #1f2937;
          font-style: italic;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Appointment Accepted!</h1>
          <p>Great news! Your appointment request has been approved</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Seller:</span>
                <span class="detail-value">${sellerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">ACCEPTED</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Your Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              <li>Mark your calendar for the scheduled appointment</li>
              <li>Prepare any questions you have about the property</li>
              <li>Arrive on time for your appointment</li>
              <li>You can now communicate with the seller through the appointment chat</li>
              <li>Contact information is now visible to both parties</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>We're excited to help you find your perfect property!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment accepted email:', error);
    return createErrorResponse(error, 'appointment_accepted_email');
  }
};

// Appointment Cancelled by Buyer Email (to seller)
export const sendAppointmentCancelledByBuyerEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName,
      purpose,
      message,
      listingId,
      cancellationReason
    } = appointmentDetails;

    const subject = `❌ Appointment Cancelled by Buyer - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Cancelled by Buyer - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #fffbeb;
          border: 2px solid #fed7aa;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #fed7aa;
          color: #d97706;
        }
        .cancellation-reason {
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .cancellation-reason h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .cancellation-reason p {
          color: #92400e;
          margin: 0;
          font-style: italic;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Appointment Cancelled</h1>
          <p>The buyer has cancelled their appointment request</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Buyer:</span>
                <span class="detail-value">${buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">CANCELLED BY BUYER</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Buyer's Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            ${cancellationReason ? `
            <div class="cancellation-reason">
              <h3>📝 Cancellation Reason:</h3>
              <p>"${cancellationReason}"</p>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 What's Next:</h3>
            <ul>
              <li>Your property is still available for other potential buyers</li>
              <li>You can continue to receive new appointment requests</li>
              <li>Consider updating your property listing if needed</li>
              <li>Monitor your appointments for new bookings</li>
              <li>You can contact support if you have any questions</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>Don't worry, more opportunities are coming your way!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment cancelled by buyer email:', error);
    return createErrorResponse(error, 'appointment_cancelled_by_buyer_email');
  }
};

// Appointment Cancelled by Seller Email (to buyer)
export const sendAppointmentCancelledBySellerEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      sellerName,
      purpose,
      message,
      listingId,
      cancellationReason
    } = appointmentDetails;

    const subject = `❌ Appointment Cancelled by Seller - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Cancelled by Seller - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #fffbeb;
          border: 2px solid #fed7aa;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #fed7aa;
          color: #d97706;
        }
        .cancellation-reason {
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .cancellation-reason h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .cancellation-reason p {
          color: #92400e;
          margin: 0;
          font-style: italic;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Appointment Cancelled</h1>
          <p>The seller has cancelled your appointment</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Seller:</span>
                <span class="detail-value">${sellerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">CANCELLED BY SELLER</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Your Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            ${cancellationReason ? `
            <div class="cancellation-reason">
              <h3>📝 Cancellation Reason:</h3>
              <p>"${cancellationReason}"</p>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 What's Next:</h3>
            <ul>
              <li>Don't worry! You can explore other similar properties</li>
              <li>Use our search filters to find properties that match your criteria</li>
              <li>Consider reaching out to other sellers for similar properties</li>
              <li>You can book new appointments anytime</li>
              <li>Check our recommendations for properties you might like</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>Keep exploring to find your perfect property!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment cancelled by seller email:', error);
    return createErrorResponse(error, 'appointment_cancelled_by_seller_email');
  }
};

// Appointment Cancelled by Admin Email (to both buyer and seller)
export const sendAppointmentCancelledByAdminEmail = async (email, appointmentDetails, userRole) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName,
      sellerName,
      purpose,
      message,
      listingId,
      cancellationReason,
      adminName
    } = appointmentDetails;

    const subject = `❌ Appointment Cancelled by Admin - ${propertyName} | UrbanSetu`;
    
    const isBuyer = userRole === 'buyer';
    const isSeller = userRole === 'seller';
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Cancelled by Admin - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #f9fafb;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #d1d5db;
          color: #6b7280;
        }
        .cancellation-reason {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .cancellation-reason h3 {
          color: #6b7280;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .cancellation-reason p {
          color: #374151;
          margin: 0;
          font-style: italic;
        }
        .admin-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .admin-info h4 {
          color: #1e40af;
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        .admin-info p {
          color: #1e40af;
          margin: 0;
          font-size: 14px;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Appointment Cancelled by Admin</h1>
          <p>This appointment has been cancelled by our admin team</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 ${isBuyer ? 'Seller' : 'Buyer'}:</span>
                <span class="detail-value">${isBuyer ? sellerName : buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">CANCELLED BY ADMIN</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 ${isBuyer ? 'Your' : 'Buyer\'s'} Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            ${cancellationReason ? `
            <div class="cancellation-reason">
              <h3>📝 Admin Cancellation Reason:</h3>
              <p>"${cancellationReason}"</p>
            </div>
            ` : ''}
            
            ${adminName ? `
            <div class="admin-info">
              <h4>👨‍💼 Admin Information:</h4>
              <p>Cancelled by: ${adminName}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 What's Next:</h3>
            <ul>
              ${isBuyer ? `
              <li>Don't worry! You can explore other similar properties</li>
              <li>Use our search filters to find properties that match your criteria</li>
              <li>Consider reaching out to other sellers for similar properties</li>
              <li>You can book new appointments anytime</li>
              <li>Contact our support team if you have any questions</li>
              ` : `
              <li>Your property is still available for other potential buyers</li>
              <li>You can continue to receive new appointment requests</li>
              <li>Consider updating your property listing if needed</li>
              <li>Monitor your appointments for new bookings</li>
              <li>Contact our support team if you have any questions</li>
              `}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>We're here to help you find the perfect property match!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment cancelled by admin email:', error);
    return createErrorResponse(error, 'appointment_cancelled_by_admin_email');
  }
};

// Appointment Reinitiated by Admin Email (to both buyer and seller)
export const sendAppointmentReinitiatedByAdminEmail = async (email, appointmentDetails, userRole) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName,
      sellerName,
      purpose,
      message,
      listingId,
      adminName
    } = appointmentDetails;

    const subject = `🔄 Appointment Reinitiated by Admin - ${propertyName} | UrbanSetu`;
    
    const isBuyer = userRole === 'buyer';
    const isSeller = userRole === 'seller';
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reinitiated by Admin - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #faf5ff;
          border: 2px solid #e9d5ff;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #e9d5ff;
          color: #7c3aed;
        }
        .admin-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .admin-info h4 {
          color: #1e40af;
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        .admin-info p {
          color: #1e40af;
          margin: 0;
          font-size: 14px;
        }
        .reinitiation-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .reinitiation-notice h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .reinitiation-notice p {
          color: #92400e;
          margin: 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Appointment Reinitiated</h1>
          <p>This appointment has been reinitiated by our admin team</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 ${isBuyer ? 'Seller' : 'Buyer'}:</span>
                <span class="detail-value">${isBuyer ? sellerName : buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">REINITIATED</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 ${isBuyer ? 'Your' : 'Buyer\'s'} Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            ${adminName ? `
            <div class="admin-info">
              <h4>👨‍💼 Admin Information:</h4>
              <p>Reinitiated by: ${adminName}</p>
            </div>
            ` : ''}
            
            <div class="reinitiation-notice">
              <h3>🔄 What This Means:</h3>
              <p>This appointment was previously cancelled by an admin but has now been reinitiated. The appointment is back to pending status and both parties can now proceed with the booking process.</p>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              ${isBuyer ? `
              <li>Review the appointment details and confirm if you still want to proceed</li>
              <li>You can communicate with the seller through the appointment chat</li>
              <li>Wait for the seller to accept or reject the appointment</li>
              <li>If accepted, prepare for your scheduled appointment</li>
              <li>Contact our support team if you have any questions</li>
              ` : `
              <li>Review the appointment details and decide whether to accept or reject</li>
              <li>You can communicate with the buyer through the appointment chat</li>
              <li>Consider the appointment details before making your decision</li>
              <li>If you accept, prepare for the scheduled appointment</li>
              <li>Contact our support team if you have any questions</li>
              `}
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>We're here to help facilitate successful property transactions!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment reinitiated by admin email:', error);
    return createErrorResponse(error, 'appointment_reinitiated_by_admin_email');
  }
};

// Appointment Reinitiated by Seller Email (to buyer)
export const sendAppointmentReinitiatedBySellerEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      sellerName,
      purpose,
      message,
      listingId,
      reinitiationCount
    } = appointmentDetails;

    const subject = `🔄 Appointment Reinitiated by Seller - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reinitiated by Seller - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #f0fdfa;
          border: 2px solid #a7f3d0;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #a7f3d0;
          color: #065f46;
        }
        .reinitiation-info {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .reinitiation-info h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .reinitiation-info p {
          color: #92400e;
          margin: 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Appointment Reinitiated</h1>
          <p>The seller has reinitiated this appointment</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Seller:</span>
                <span class="detail-value">${sellerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">REINITIATED</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Seller's Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            <div class="reinitiation-info">
              <h3>🔄 What This Means:</h3>
              <p>The seller has reinitiated this appointment with new details. This appointment was previously cancelled by the seller but they have now decided to proceed with it again. You can now review the updated details and decide whether to accept or reject this appointment.</p>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              <li>Review the updated appointment details carefully</li>
              <li>Check if the new date and time work for you</li>
              <li>You can communicate with the seller through the appointment chat</li>
              <li>Decide whether to accept or reject this reinitiated appointment</li>
              <li>If you accept, prepare for your scheduled appointment</li>
              <li>Contact our support team if you have any questions</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>We're here to help facilitate successful property transactions!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment reinitiated by seller email:', error);
    return createErrorResponse(error, 'appointment_reinitiated_by_seller_email');
  }
};

// Appointment Reinitiated by Buyer Email (to seller)
export const sendAppointmentReinitiatedByBuyerEmail = async (email, appointmentDetails) => {
  try {
    const { 
      appointmentId,
      propertyName, 
      propertyDescription, 
      propertyAddress,
      propertyPrice,
      propertyImages,
      date, 
      time, 
      buyerName,
      purpose,
      message,
      listingId,
      reinitiationCount
    } = appointmentDetails;

    const subject = `🔄 Appointment Reinitiated by Buyer - ${propertyName} | UrbanSetu`;
    
    // Format date and time
    const appointmentDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const appointmentTime = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Time TBD';

    // Get property image for email
    const propertyImage = propertyImages && propertyImages.length > 0 
      ? propertyImages[0] 
      : `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/placeholder-property.jpg`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reinitiated by Buyer - UrbanSetu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .appointment-card {
          background: #fffbeb;
          border: 2px solid #fed7aa;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .property-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        .property-address {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 15px 0;
        }
        .property-price {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 20px 0;
        }
        .appointment-details {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #fed7aa;
          color: #92400e;
        }
        .reinitiation-info {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .reinitiation-info h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .reinitiation-info p {
          color: #92400e;
          margin: 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 15px 30px;
          margin: 10px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white !important;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .next-steps {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps h3 {
          color: #d97706;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #3b82f6;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 20px;
          }
          .btn {
            display: block;
            width: 100%;
            margin: 10px 0;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Appointment Reinitiated</h1>
          <p>The buyer has reinitiated this appointment</p>
        </div>
        
        <div class="content">
          <div class="appointment-card">
            <img src="${propertyImage}" alt="${propertyName}" class="property-image" />
            <h2 class="property-title">${propertyName}</h2>
            <p class="property-address">📍 ${propertyAddress || 'Address not specified'}</p>
            <p class="property-price">💰 ₹${propertyPrice || 'Price not specified'}</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👤 Buyer:</span>
                <span class="detail-value">${buyerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📊 Status:</span>
                <span class="detail-value">
                  <span class="status-badge">REINITIATED</span>
                </span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">🎯 Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            ${message ? `
            <div class="message-section">
              <div class="message-label">💬 Buyer's Message:</div>
              <div class="message-text">"${message}"</div>
            </div>
            ` : ''}
            
            <div class="reinitiation-info">
              <h3>🔄 What This Means:</h3>
              <p>The buyer has reinitiated this appointment with new details. This appointment was previously cancelled by the buyer but they have now decided to proceed with it again. You can now review the updated details and decide whether to accept or reject this appointment.</p>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/listing/${listingId}" class="btn btn-primary">
              🏠 View Property Details
            </a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/user/my-appointments" class="btn btn-secondary">
              📅 My Appointments
            </a>
          </div>
          
          <div class="next-steps">
            <h3>📋 Next Steps:</h3>
            <ul>
              <li>Review the updated appointment details carefully</li>
              <li>Check if the new date and time work for you</li>
              <li>You can communicate with the buyer through the appointment chat</li>
              <li>Decide whether to accept or reject this reinitiated appointment</li>
              <li>If you accept, prepare for the scheduled appointment</li>
              <li>Contact our support team if you have any questions</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>UrbanSetu - Smart Real Estate Platform</strong></p>
          <p>We're here to help facilitate successful property transactions!</p>
          <div class="social-links">
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}">Website</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/contact">Support</a>
            <a href="${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/privacy">Privacy</a>
          </div>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await sendEmailWithRetry({
      to: email,
      subject: subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending appointment reinitiated by buyer email:', error);
    return createErrorResponse(error, 'appointment_reinitiated_by_buyer_email');
  }
};

// Export the current transporter (will be set during initialization)
export default currentTransporter;
