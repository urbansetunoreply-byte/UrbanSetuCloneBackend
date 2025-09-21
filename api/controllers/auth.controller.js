import User from "../models/user.model.js";
import PasswordLockout from "../models/passwordLockout.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from 'jsonwebtoken'
import { generateOTP, sendSignupOTPEmail,sendLoginOTPEmail } from "../utils/emailService.js";
import { generateTokenPair, setSecureCookies, clearAuthCookies } from "../utils/jwtUtils.js";
import { trackFailedAttempt, clearFailedAttempts, logSecurityEvent, sendAdminAlert, isAccountLocked, checkSuspiciousSignup, getAccountLockRemainingMs } from "../middleware/security.js";
import { 
  createEnhancedSession, 
  updateSessionActivity, 
  detectConcurrentLogins, 
  cleanupOldSessions,
  checkSuspiciousLogin,
  enforceSessionLimits,
  logSessionAction
} from "../utils/sessionManager.js";
import { sendNewLoginEmail, sendSuspiciousLoginEmail } from "../utils/emailService.js";
import OtpTracking from "../models/otpTracking.model.js";
import DeletedAccount from "../models/deletedAccount.model.js";
import { validateEmail } from "../utils/emailValidation.js";
import { getDeviceInfo, getLocationFromIP } from "../utils/sessionManager.js";

export const SignUp=async (req,res,next)=>{
    const {username,email,password,role,mobileNumber,address,emailVerified}=req.body;
    const emailLower = email.toLowerCase();
    
    // Validate mobile number
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
        return next(errorHandler(400, "Please provide a valid 10-digit mobile number"));
    }
    
    // Validate address (optional but if provided, should not be empty)
    if (address && address.trim().length === 0) {
        return next(errorHandler(400, "Please provide a valid address"));
    }
    
    // Check if email is verified
    if (!emailVerified) {
        return next(errorHandler(400, "Please verify your email address before creating an account"));
    }

    // Validate email for fraud detection
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const emailValidation = validateEmail(email, {
        logSecurity: true,
        context: 'signup',
        ip,
        userAgent
    });

    if (!emailValidation.isValid) {
        // Log fraud attempt for security monitoring
        if (emailValidation.isFraud) {
            logSecurityEvent('fraud_email_signup_attempt', {
                email: emailLower,
                reason: emailValidation.reason,
                ip,
                userAgent,
                username
            });
        }
        return next(errorHandler(400, emailValidation.message));
    }
    
    try {
        // Check softban/purge policy before allowing signup
        const existingSoftban = await DeletedAccount.findOne({ email: emailLower });
        if (existingSoftban) {
            const policy = existingSoftban.policy || {};
            // Purged? If purged and banType is 'ban', block permanently
            if (existingSoftban.purgedAt && policy.banType === 'ban') {
                return next(errorHandler(403, "This account was permanently removed and cannot be used to sign up again."));
            }
            // If explicit ban
            if (policy.banType === 'ban') {
                return next(errorHandler(403, "This account has been permanently banned due to policy violations. Please contact support if you believe this is a mistake."));
            }
            // If allowed but with cooling-off period
            if (!existingSoftban.purgedAt && typeof policy.allowResignupAfterDays === 'number' && policy.allowResignupAfterDays > 0) {
                const allowAfter = new Date(existingSoftban.deletedAt.getTime() + policy.allowResignupAfterDays * 24 * 60 * 60 * 1000);
                if (new Date() < allowAfter) {
                    const daysLeft = Math.ceil((allowAfter.getTime() - Date.now()) / (24*60*60*1000));
                    return next(errorHandler(403, `Please wait ${daysLeft} more day(s) before signing up again.`));
                }
            }
            // Show contextual messages
            if (policy.category === 'inactive_auto') {
                return next(errorHandler(403, "This account was deactivated due to long inactivity. You may create a new account or contact support to restore."));
            }
            if (policy.category === 'requested_by_user') {
                return next(errorHandler(403, "This account was deleted at your request. You may sign up again anytime."));
            }
            // Otherwise allow signup to proceed (non-banned)
        }
        // Check if email already exists
        const existingEmail = await User.findOne({ email: emailLower });
        if (existingEmail) {
            logSecurityEvent('duplicate_signup_attempt', { email: emailLower, reason: 'email_exists' });
            return next(errorHandler(400, "An account with this email already exists. Please sign in instead!"));
        }
        
        // Check if mobile number already exists
        const existingMobile = await User.findOne({ mobileNumber });
        if (existingMobile) {
            logSecurityEvent('duplicate_signup_attempt', { email: emailLower, mobileNumber, reason: 'mobile_exists' });
            return next(errorHandler(400, "An account with this mobile number already exists. Try signing in or use a different number."));
        }
        
        const hashedPassword=bcryptjs.hashSync(password,10)
        
        // Set admin approval status based on role
        const adminApprovalStatus = role === "admin" ? "pending" : "approved";
        
        const newUser=new User({
            username,
            email: emailLower,
            password:hashedPassword,
            mobileNumber,
            address: address ? address.trim() : undefined,
            role,
            adminApprovalStatus
        })
        
        await newUser.save();
        
        // Check for suspicious signup patterns
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        checkSuspiciousSignup(emailLower, ip, userAgent);
        
        // Log successful signup
        logSecurityEvent('successful_signup', { 
            email: emailLower, 
            userId: newUser._id,
            role: newUser.role,
            ip
        });
        
        if (role === "admin") {
            res.status(201).json({
                message: "Admin account created successfully. Please wait for approval from an existing admin.",
                requiresApproval: true
            });
        } else {
            res.status(201).json({
                message: "User added successfully",
                requiresApproval: false
            });
        }
    }
    catch(error){ 
       console.error(error);
       next(error)
    }
}

export const SignIn=async(req,res,next)=>{
    const {email,password}=req.body 
    const emailLower = email.toLowerCase();
    const identifier = req.ip || req.connection.remoteAddress;
    
    try{
        const validUser=await User.findOne({email: emailLower})
        if (!validUser){
            // Check if this email is softbanned/purged and communicate appropriately
            try {
                const del = await DeletedAccount.findOne({ email: emailLower });
                if (del) {
                    const policy = del.policy || {};
                    if (policy.banType === 'ban') {
                        return next(errorHandler(403, "This account is temporarily suspended. Please reach out to support for help."));
                    }
                    if (!del.purgedAt && typeof policy.allowResignupAfterDays === 'number' && policy.allowResignupAfterDays > 0 && del.deletedAt) {
                        const allowAfter = new Date(del.deletedAt.getTime() + policy.allowResignupAfterDays * 24 * 60 * 60 * 1000);
                        if (new Date() < allowAfter) {
                            const msLeft = allowAfter.getTime() - Date.now();
                            const days = Math.floor(msLeft / (24*60*60*1000));
                            const hours = Math.floor((msLeft % (24*60*60*1000)) / (60*60*1000));
                            const minutes = Math.floor((msLeft % (60*60*1000)) / (60*1000));
                            const waitMsg = days > 0 ? `${days} day(s)` : (hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`);
                            return next(errorHandler(403, `This account is temporarily suspended. Please reach out to support for help.`));
                        }
                    }
                }
            } catch (_) {}
            // Track failed attempt
            trackFailedAttempt(identifier);
            logSecurityEvent('failed_login', { email: emailLower, reason: 'user_not_found' });
            return next(errorHandler(401,"Invalid email address or password"))
        }
        
        // Check if account is locked
        if (await isAccountLocked(validUser._id)) {
            logSecurityEvent('account_locked_attempt', { email: emailLower, userId: validUser._id });
            const remainingMs = await getAccountLockRemainingMs(validUser._id, emailLower);
            const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
            return next(errorHandler(423, `Account is temporarily locked due to too many failed attempts. Try again in about ${remainingMinutes} minute${remainingMinutes>1?'s, or reset your password':''}.`));
        }
        
        if (validUser.status === 'suspended') {
            logSecurityEvent('suspended_account_attempt', { email: emailLower, userId: validUser._id });
            return next(errorHandler(403, "This account is temporarily suspended. Please reach out to support for help."));
        }
        
        // Also check for softbanned/purged policies (edge case: if account still exists but also recorded)
        try {
            const del = await DeletedAccount.findOne({ email: emailLower });
            if (del) {
                const policy = del.policy || {};
                if (policy.banType === 'ban') {
                    return next(errorHandler(403, "This account is temporarily suspended. Please reach out to support for help."));
                }
                if (!del.purgedAt && typeof policy.allowResignupAfterDays === 'number' && policy.allowResignupAfterDays > 0 && del.deletedAt) {
                    const allowAfter = new Date(del.deletedAt.getTime() + policy.allowResignupAfterDays * 24 * 60 * 60 * 1000);
                    if (new Date() < allowAfter) {
                        const msLeft = allowAfter.getTime() - Date.now();
                        const days = Math.floor(msLeft / (24*60*60*1000));
                        const hours = Math.floor((msLeft % (24*60*60*1000)) / (60*60*1000));
                        const minutes = Math.floor((msLeft % (60*60*1000)) / (60*1000));
                        const waitMsg = days > 0 ? `${days} day(s)` : (hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`);
                        return next(errorHandler(403, "This account is temporarily suspended. Please reach out to support for help."));
                    }
                }
            }
        } catch(_) {}
        
        const validPassword=await bcryptjs.compareSync(password,validUser.password)
        if (!validPassword){
            // Track failed attempt
            trackFailedAttempt(identifier, validUser._id);
            logSecurityEvent('failed_login', { email: emailLower, userId: validUser._id, reason: 'invalid_password' });
            return next(errorHandler(401,"Invalid email address or password"))
        }
        
        // Check if admin account is pending approval
        if (validUser.role === "admin" && validUser.adminApprovalStatus === "pending") {
            return next(errorHandler(403, "Your admin account is pending approval. Please wait for an existing admin to approve your request."));
        }
        
        // Check if admin account was rejected
        if (validUser.role === "admin" && validUser.adminApprovalStatus === "rejected") {
            return next(errorHandler(403, "Your admin account request has been rejected. Please contact support for more information."));
        }
        
        // Clear failed attempts on successful login
        clearFailedAttempts(identifier);
        
        // Get device info and check for suspicious login
        const userAgent = req.get('User-Agent');
        const device = getDeviceInfo(userAgent);
        const location = getLocationFromIP(identifier);
        
        // Check for suspicious login patterns
        const suspiciousCheck = await checkSuspiciousLogin(validUser._id, identifier, device);
        
        // Create enhanced session
        const session = await createEnhancedSession(validUser._id, req);
        
        // Enforce role-based session limits
        await enforceSessionLimits(validUser._id, validUser.role);
        
        // Check for concurrent logins
        const concurrentInfo = detectConcurrentLogins(validUser._id, session.sessionId);
        
        // Send email notifications
        try {
            // Always send new login notification
            await sendNewLoginEmail(
                validUser.email,
                device,
                identifier,
                location,
                new Date()
            );
            
            // Send suspicious login alert if detected
            if (suspiciousCheck.isSuspicious) {
                await sendSuspiciousLoginEmail(
                    validUser.email,
                    device,
                    identifier,
                    location,
                    suspiciousCheck.previousDevice,
                    suspiciousCheck.previousIp,
                    'Unknown Location' // Previous location not stored
                );
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Don't fail login if email fails
        }
        
        // Log session action
        await logSessionAction(
            validUser._id,
            'login',
            session.sessionId,
            identifier,
            device,
            location,
            `Successful login with ${concurrentInfo.activeSessions} concurrent sessions`,
            suspiciousCheck.isSuspicious,
            suspiciousCheck.reason
        );
        
        // Log successful login
        logSecurityEvent('successful_login', { 
            email: emailLower, 
            userId: validUser._id,
            ip: identifier,
            userAgent,
            sessionId: session.sessionId,
            concurrentLogins: concurrentInfo.activeSessions
        });
        
        // Generate token pair
        const { accessToken, refreshToken } = generateTokenPair({ id: validUser._id });
        
        // Set secure cookies
        setSecureCookies(res, accessToken, refreshToken);
        
        res.status(200).json({
            _id: validUser._id,
            username: validUser.username,
            email: validUser.email,
            role: validUser.role,
            isDefaultAdmin: validUser.isDefaultAdmin,
            adminApprovalStatus: validUser.adminApprovalStatus,
            status: validUser.status,
            avatar: validUser.avatar,
            mobileNumber: validUser.mobileNumber,
            address: validUser.address,
            gender: validUser.gender,
            token: accessToken, // Keep for backward compatibility
        });
    }
    catch(error){
        console.error(error);
        next(error)
    }
}

export const Google=async (req,res,next)=>{
    try{
        const {name,email,photo}=req.body 
        const validUser=await User.findOne({email})
        if (validUser){
            // Suspension check
            if (validUser.status === 'suspended') {
                return next(errorHandler(403, "Your account is suspended. Please contact support."));
            }
            // Generate token pair
            const { accessToken, refreshToken } = generateTokenPair({ id: validUser._id });
            
            // Set secure cookies
            setSecureCookies(res, accessToken, refreshToken);
            
            res.status(200).json({
                _id: validUser._id,
                username: validUser.username,
                email: validUser.email,
                role: validUser.role,
                isDefaultAdmin: validUser.isDefaultAdmin,
                adminApprovalStatus: validUser.adminApprovalStatus,
                status: validUser.status,
                avatar: validUser.avatar,
                mobileNumber: validUser.mobileNumber,
                address: validUser.address,
                gender: validUser.gender,
                token: accessToken, // Keep for backward compatibility
            });
        }
        else{
            const generatedPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcryptjs.hashSync(generatedPassword,10);
            // Generate a random unique mobile number for Google signup
            let mobileNumber;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10; // Prevent infinite loop
            while (!isUnique && attempts < maxAttempts) {
                // Generate a random 10-digit number starting with 9 (to avoid conflicts with real numbers)
                mobileNumber = "9" + Math.random().toString().slice(2, 11);
                // Check if this mobile number already exists
                const existingUser = await User.findOne({ mobileNumber });
                if (!existingUser) {
                    isUnique = true;
                }
                attempts++;
            }
            // If we couldn't find a unique number after max attempts, use timestamp-based number
            if (!isUnique) {
                const timestamp = Date.now().toString();
                mobileNumber = "9" + timestamp.slice(-9);
            }
            const newUser=new User({
                username:name.split(" ").join("").toLowerCase()+Math.random().toString(36).slice(-8),
                email,
                password:hashedPassword,
                avatar:photo,
                mobileNumber: mobileNumber,
                isGeneratedMobile: true
            })
            await newUser.save()
            
            // Generate token pair
            const { accessToken, refreshToken } = generateTokenPair({ id: newUser._id });
            
            // Set secure cookies
            setSecureCookies(res, accessToken, refreshToken);
            
            res.status(200).json({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                isDefaultAdmin: newUser.isDefaultAdmin,
                adminApprovalStatus: newUser.adminApprovalStatus,
                status: newUser.status,
                avatar: newUser.avatar,
                mobileNumber: newUser.mobileNumber,
                isGeneratedMobile: newUser.isGeneratedMobile,
                address: newUser.address,
                gender: newUser.gender,
                token: accessToken, // Keep for backward compatibility
            });
        }
    }
    catch(error){
        console.error(error);
        next(error)
    }
}


export const Signout = async (req, res, next) => {
    try {
      clearAuthCookies(res);
      res.status(200).json('User has been logged out!');
    } catch (error) {
      next(error);
    }
  };

export const verifyAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies.access_token;
        const refreshToken = req.cookies.refresh_token;
        
        if (!accessToken && !refreshToken) {
            return next(errorHandler(401, "No authentication tokens found"));
        }
        
        let decoded;
        
        try {
            // Try to verify access token first
            decoded = jwt.verify(accessToken, process.env.JWT_TOKEN, {
                issuer: 'urbansetu',
                audience: 'urbansetu-users'
            });
        } catch (accessError) {
            // If access token is invalid or expired, try refresh token
            if (accessError.name === 'TokenExpiredError' && refreshToken) {
                try {
                    const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_TOKEN, {
                        issuer: 'urbansetu',
                        audience: 'urbansetu-refresh'
                    });
                    
                    // Generate new token pair
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair({ id: refreshDecoded.id });
                    
                    // Set new cookies
                    setSecureCookies(res, newAccessToken, newRefreshToken);
                    
                    decoded = refreshDecoded;
                } catch (refreshError) {
                    return next(errorHandler(401, "Session expired. Please sign in again."));
                }
            } else {
                return next(errorHandler(401, "Invalid token"));
            }
        }
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        
        res.status(200).json(user);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(errorHandler(401, "Invalid token"));
        }
        if (error.name === 'TokenExpiredError') {
            return next(errorHandler(401, "Token expired"));
        }
        next(error);
    }
};

// Store for password reset tokens (in production, use Redis)
const resetTokenStore = new Map();

// Clean up expired reset tokens every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of resetTokenStore.entries()) {
        if (now > data.expiresAt) {
            resetTokenStore.delete(token);
        }
    }
}, 5 * 60 * 1000);

// Forgot Password - Verify email only (mobile number verification removed)
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return next(errorHandler(400, "Email is required"));
        }
        
        const emailLower = email.toLowerCase();
        // Find user with matching email
        const user = await User.findOne({ email: emailLower });
        
        if (user) {
            // Generate reset token (30 minutes expiry)
            const resetToken = jwt.sign(
                { 
                    id: user._id, 
                    email: emailLower,
                    type: 'password_reset'
                }, 
                process.env.JWT_TOKEN, 
                { expiresIn: '30m' }
            );
            
            // Store reset token with expiration
            resetTokenStore.set(resetToken, {
                userId: user._id,
                email: emailLower,
                expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
                used: false
            });
            
            // TODO: Send reset email with token
            // For now, we'll just return success
        }
        
        // Always return success message to prevent email enumeration
        res.status(200).json({ 
            message: "If this email exists, we sent instructions.",
            success: true
        });
    } catch (error) {
        next(error);
    }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;
        
        if (!userId || !newPassword || !confirmPassword) {
            return next(errorHandler(400, "All fields are required"));
        }
        
        if (newPassword !== confirmPassword) {
            return next(errorHandler(400, "Passwords do not match"));
        }
        
        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return next(errorHandler(400, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"));
        }
        
        // Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        
        // Check if new password is different from current password
        const isSamePassword = await bcryptjs.compare(newPassword, user.password);
        if (isSamePassword) {
            return next(errorHandler(400, "New password must be different from current password"));
        }
        
        // Update password
        user.password = bcryptjs.hashSync(newPassword, 10);
        // If user status was incorrectly set to a non-enum value like 'locked', normalize to 'active'
        if (user.status !== 'active' && user.status !== 'suspended') {
            user.status = 'active';
        }
        await user.save();

        // Clear any active password lockouts for this user/email after successful reset
        try {
            await PasswordLockout.clearUserLock({ userId: user._id });
            await PasswordLockout.clearUserLock({ email: user.email });
        } catch (_) {}
        
        res.status(200).json({ 
            message: "Password reset successful. You can now log in.",
            success: true
        });
    } catch (error) {
        next(error);
    }
};

// Store OTPs temporarily for login (in production, use Redis or database)
const loginOtpStore = new Map();

// Send OTP for login
export const sendLoginOTP = async (req, res, next) => {
    const { email } = req.body;
    const { otpTracking, requiresCaptcha } = req;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
    
    if (!email) {
        return next(errorHandler(400, "Email is required"));
    }

    const emailLower = email.toLowerCase();

    // Validate email for fraud detection
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const emailValidation = validateEmail(email, {
        logSecurity: true,
        context: 'login_otp',
        ip,
        userAgent
    });

    if (!emailValidation.isValid) {
        // Log fraud attempt for security monitoring
        if (emailValidation.isFraud) {
            logSecurityEvent('fraud_email_login_otp_attempt', {
                email: emailLower,
                reason: emailValidation.reason,
                ip,
                userAgent
            });
        }
        return res.status(400).json({
            success: false,
            message: emailValidation.message
        });
    }

    try {
        // Check active lockout due to excessive OTP requests
        if (otpTracking && otpTracking.isLocked && otpTracking.isLocked()) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP requests. Please try again in 15 minutes.",
                requiresCaptcha: false
            });
        }
        // Check if user exists with the email
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            // If no user, check if this email is softbanned/purged and communicate appropriately
            try {
                const del = await DeletedAccount.findOne({ email: emailLower });
                if (del) {
                    const policy = del.policy || {};
                    if (policy.banType === 'ban') {
                        return res.status(403).json({
                            success: false,
                            message: 'This account was permanently removed and cannot sign in.'
                        });
                    }
                    if (!del.purgedAt && typeof policy.allowResignupAfterDays === 'number' && policy.allowResignupAfterDays > 0 && del.deletedAt) {
                        const allowAfter = new Date(del.deletedAt.getTime() + policy.allowResignupAfterDays * 24 * 60 * 60 * 1000);
                        if (new Date() < allowAfter) {
                            const msLeft = allowAfter.getTime() - Date.now();
                            const days = Math.floor(msLeft / (24*60*60*1000));
                            const hours = Math.floor((msLeft % (24*60*60*1000)) / (60*60*1000));
                            const minutes = Math.floor((msLeft % (60*60*1000)) / (60*1000));
                            const waitMsg = days > 0 ? `${days} day(s)` : (hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`);
                            return res.status(403).json({
                                success: false,
                                message: `Your account is softbanned. Please try again after ${waitMsg}.`
                            });
                        }
                    }
                }
            } catch (_) {}
            return res.status(400).json({
                success: false,
                message: "We couldn't find an account with this email. Sign up to create one."
            });
        }

        // Block OTP sending for suspended accounts
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Please contact support."
            });
        }

        // Also block OTP for softbanned/purged policies (edge case: if account still exists but also recorded)
        try {
            const del = await DeletedAccount.findOne({ email: emailLower });
            if (del) {
                const policy = del.policy || {};
                if (policy.banType === 'ban') {
                    return res.status(403).json({ success: false, message: 'This account is permanently banned.' });
                }
                if (!del.purgedAt && typeof policy.allowResignupAfterDays === 'number' && policy.allowResignupAfterDays > 0 && del.deletedAt) {
                    const allowAfter = new Date(del.deletedAt.getTime() + policy.allowResignupAfterDays * 24 * 60 * 60 * 1000);
                    if (new Date() < allowAfter) {
                        const msLeft = allowAfter.getTime() - Date.now();
                        const days = Math.floor(msLeft / (24*60*60*1000));
                        const hours = Math.floor((msLeft % (24*60*60*1000)) / (60*60*1000));
                        const minutes = Math.floor((msLeft % (60*60*1000)) / (60*1000));
                        const waitMsg = days > 0 ? `${days} day(s)` : (hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`);
                        return res.status(403).json({ success: false, message: `Your account is softbanned. Please try again after ${waitMsg}.` });
                    }
                }
            }
        } catch(_) {}

        // Block OTP sending if account is password-locked due to failed attempts
        try {
            if (await isAccountLocked(user._id)) {
                const remainingMs = await getAccountLockRemainingMs(user._id, user.email);
                const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
                return res.status(423).json({
                    success: false,
                    message: `Account is temporarily locked due to too many failed attempts. Try again in about ${remainingMinutes} minute${remainingMinutes>1?'s, or reset your password':''}.`
                });
            }
        } catch (_) {}

        // Increment OTP request count and attach ip/userAgent for auditing
        await otpTracking.incrementOtpRequest();
        
        // If 5 requests within 15 minutes -> 15 min lockout
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (otpTracking.otpRequestCount >= 5 && otpTracking.lastOtpTimestamp >= fifteenMinutesAgo) {
            await otpTracking.registerLockout(15 * 60 * 1000);
            return res.status(429).json({
                success: false,
                message: "Too many OTP requests. Please try again in 15 minutes.",
                requiresCaptcha: false
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiration (5 minutes for better security)
        const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes
        loginOtpStore.set(emailLower, {
            otp,
            expirationTime,
            attempts: 0,
            userId: user._id,
            trackingId: otpTracking._id
        });

        // Send OTP email for login
        const emailResult = await sendLoginOTPEmail(emailLower, otp);
        
        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
        }

        // Log successful OTP request
        logSecurityEvent('otp_request_successful', {
            email: emailLower,
            userId: user._id,
            ip: ipAddress,
            requiresCaptcha: requiresCaptcha
        });

        // If 3 OTP requests within 5 minutes -> require captcha on subsequent requests
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (otpTracking.otpRequestCount >= 3 && otpTracking.lastOtpTimestamp >= fiveMinutesAgo) {
            otpTracking.requiresCaptcha = true;
            await otpTracking.save();
        }

        res.status(200).json({
            success: true,
            message: "OTP sent successfully to your email",
            requiresCaptcha: false // Reset after successful request
        });

    } catch (error) {
        console.error('Send login OTP error:', error);
        next(error);
    }
};

// Verify OTP and login
export const verifyLoginOTP = async (req, res, next) => {
    const { email, otp } = req.body;
    const { otpTracking } = req;
    
    if (!email || !otp) {
        return next(errorHandler(400, "Email and OTP are required"));
    }

    const emailLower = email.toLowerCase();

    try {
        // If verification is currently locked due to too many failures
        if (otpTracking && otpTracking.isLocked && otpTracking.isLocked()) {
            return res.status(423).json({
                success: false,
                message: "Too many incorrect attempts. Please try again in 15 minutes.",
                requiresCaptcha: true
            });
        }
        // Get stored OTP data
        const storedData = loginOtpStore.get(emailLower);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "OTP expired or not found. Please request a new OTP."
            });
        }

        // Check if OTP is expired
        if (Date.now() > storedData.expirationTime) {
            loginOtpStore.delete(emailLower);
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });
        }

        // Check if too many attempts
        if (storedData.attempts >= 3) {
            loginOtpStore.delete(emailLower);
            // Track failed attempt in DB and consider lockout
            if (otpTracking) {
                await otpTracking.incrementFailedAttempt();
                // 5 wrong attempts in 15 mins -> 15 min lockout
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                if (otpTracking.failedOtpAttempts >= 5 && otpTracking.lastFailedAttemptTimestamp >= fifteenMinutesAgo) {
                    await otpTracking.registerLockout(15 * 60 * 1000);
                }
            }
            return res.status(400).json({
                success: false,
                message: "Too many failed attempts. Please request a new OTP.",
                requiresCaptcha: otpTracking?.requiresCaptcha || false
            });
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            storedData.attempts += 1;
            loginOtpStore.set(emailLower, storedData);
            
            // Increment failed attempts in tracking
            if (otpTracking) {
                await otpTracking.incrementFailedAttempt();
                // If 3 wrong attempts -> invalidate current OTP (force new request)
                if (storedData.attempts >= 3) {
                    loginOtpStore.delete(emailLower);
                }
                // If 5 wrong attempts within 15 minutes -> 15 min lock
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                if (otpTracking.failedOtpAttempts >= 5 && otpTracking.lastFailedAttemptTimestamp >= fifteenMinutesAgo) {
                    await otpTracking.registerLockout(15 * 60 * 1000);
                }
            }
            
            // Log failed OTP attempt
            logSecurityEvent('otp_verification_failed', {
                email: emailLower,
                userId: storedData.userId,
                ip: req.ip,
                attempts: storedData.attempts
            });
            
            return res.status(400).json({
                success: false,
                message: storedData.attempts >= 3 ? "Too many incorrect attempts. Please try again in 15 minutes." : "Invalid OTP. Please try again.",
                requiresCaptcha: otpTracking?.requiresCaptcha || false
            });
        }

        // OTP is valid, get user and create session
        const user = await User.findById(storedData.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is approved
        if (user.adminApprovalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Please contact support."
            });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Please contact support."
            });
        }

        // Get device info and check for suspicious login
        const userAgent = req.get('User-Agent');
        const device = getDeviceInfo(userAgent);
        const location = getLocationFromIP(req.ip);
        
        // Check for suspicious login patterns
        const suspiciousCheck = await checkSuspiciousLogin(user._id, req.ip, device);
        
        // Create enhanced session
        const session = await createEnhancedSession(user._id, req);
        
        // Enforce role-based session limits
        await enforceSessionLimits(user._id, user.role);
        
        // Generate token pair
        const { accessToken, refreshToken } = generateTokenPair({ id: user._id });
        
        // Clear OTP from store
        loginOtpStore.delete(emailLower);
        
        // Reset tracking on successful login
        if (otpTracking) {
            await otpTracking.resetTracking();
            await otpTracking.clearLockout?.();
        }
        
        // Send email notifications
        try {
            // Always send new login notification
            await sendNewLoginEmail(
                user.email,
                device,
                req.ip,
                location,
                new Date()
            );
            
            // Send suspicious login alert if detected
            if (suspiciousCheck.isSuspicious) {
                await sendSuspiciousLoginEmail(
                    user.email,
                    device,
                    req.ip,
                    location,
                    suspiciousCheck.previousDevice,
                    suspiciousCheck.previousIp,
                    'Unknown Location' // Previous location not stored
                );
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Don't fail login if email fails
        }
        
        // Log session action
        await logSessionAction(
            user._id,
            'login',
            session.sessionId,
            req.ip,
            device,
            location,
            'OTP login successful',
            suspiciousCheck.isSuspicious,
            suspiciousCheck.reason
        );
        
        // Log successful OTP login
        logSecurityEvent('otp_login_successful', {
            email: emailLower,
            userId: user._id,
            ip: req.ip
        });

        // Set secure cookies
        setSecureCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: accessToken, // Keep for backward compatibility
            role: user.role,
            isDefaultAdmin: user.isDefaultAdmin,
            adminApprovalStatus: user.adminApprovalStatus,
            status: user.status,
            avatar: user.avatar,
            mobileNumber: user.mobileNumber,
            isGeneratedMobile: user.isGeneratedMobile,
            address: user.address,
            gender: user.gender,
            username: user.username,
            email: user.email
        });

    } catch (error) {
        console.error('Verify login OTP error:', error);
        next(error);
    }
};

// Clean up expired login OTPs periodically
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of loginOtpStore.entries()) {
        if (now > data.expirationTime) {
            loginOtpStore.delete(email);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes
