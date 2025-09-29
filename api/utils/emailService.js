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
              <h2 style="color: #1f2937; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Goodbye, ${username}!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Your account has been successfully deleted from UrbanSetu. We're sorry to see you go!</p>
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
                Thank you for being part of the UrbanSetu community. We hope to serve you again in the future!
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

// Export the current transporter (will be set during initialization)
export default currentTransporter;
