import nodemailer from 'nodemailer';

// Enhanced transporter configuration with better error handling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Disable connection pooling for Render environment
  pool: false,
  // More conservative timeout settings for Render
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 15000,   // 15 seconds
  socketTimeout: 30000,     // 30 seconds
  // Additional Gmail-specific settings
  secure: true,
  port: 587,
  tls: {
    rejectUnauthorized: false
  },
  // Retry configuration
  retryDelay: 2000,
  maxRetries: 3
});

// Email delivery tracking
const emailDeliveryStats = {
  sent: 0,
  failed: 0,
  retries: 0,
  lastSent: null,
  lastError: null
};

// Verify transporter connection before sending
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error.message);
    return false;
  }
};

// Enhanced retry logic with exponential backoff and connection verification
const sendEmailWithRetry = async (mailOptions, maxRetries = 3, baseDelay = 1000) => {
  // Verify connection before first attempt
  if (!await verifyTransporter()) {
    return {
      success: false,
      error: 'Email service connection failed',
      attempts: 0
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail(mailOptions);
      
      // Track successful delivery
      emailDeliveryStats.sent++;
      emailDeliveryStats.lastSent = new Date();
      
      console.log(`Email sent successfully to ${mailOptions.to} (attempt ${attempt})`);
      return { 
        success: true, 
        messageId: result.messageId,
        attempt: attempt
      };
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error.message);
      
      // Check for specific error types
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        console.error('Connection error detected, attempting to reconnect...');
        // Try to verify connection again
        await verifyTransporter();
      }
      
      // Track failed attempts
      if (attempt === maxRetries) {
        emailDeliveryStats.failed++;
        emailDeliveryStats.lastError = {
          message: error.message,
          timestamp: new Date(),
          recipient: mailOptions.to,
          errorCode: error.code
        };
        
        return { 
          success: false, 
          error: error.message,
          attempts: attempt,
          errorCode: error.code
        };
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      emailDeliveryStats.retries++;
      
      console.log(`Retrying email send in ${delay}ms...`);
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
              <p style="margin: 5px 0; color: #374151;"><strong>Login Time:</strong> ${new Date(loginTime).toLocaleString()}</p>
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
              <p style="margin: 5px 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
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

// Legacy function for backward compatibility (deprecated)
export const sendOTPEmail = async (email, otp) => {
  console.warn('sendOTPEmail is deprecated. Use sendSignupOTPEmail or sendForgotPasswordOTPEmail instead.');
  return await sendSignupOTPEmail(email, otp);
};

// Initialize email service and verify connection on startup
const initializeEmailService = async () => {
  console.log('Initializing email service...');
  
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email service initialization failed: Missing EMAIL_USER or EMAIL_PASS environment variables');
    return false;
  }
  
  console.log(`📧 Email service configured for: ${process.env.EMAIL_USER}`);
  
  // Verify connection
  const isConnected = await verifyTransporter();
  if (isConnected) {
    console.log('✅ Email service initialized successfully');
  } else {
    console.error('❌ Email service initialization failed: Connection verification failed');
  }
  
  return isConnected;
};

// Auto-initialize email service
initializeEmailService().catch(error => {
  console.error('Email service auto-initialization failed:', error);
});

export default transporter;