import express from 'express'
import { SignUp,SignIn,Google,Signout,verifyAuth,forgotPassword,resetPassword,sendLoginOTP,verifyLoginOTP} from '../controllers/auth.controller.js'
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { verifyToken } from '../utils/verify.js';
import { sendOTP, verifyOTP, sendForgotPasswordOTP, sendProfileEmailOTP } from '../controllers/emailVerification.controller.js';
import { signInRateLimit, signUpRateLimit, forgotPasswordRateLimit, otpRateLimit } from '../middleware/rateLimiter.js';
import { generateCSRFToken, verifyCSRFToken, getCSRFToken } from '../middleware/csrf.js';
import { bruteForceProtection, getFailedAttempts } from '../middleware/security.js';
import { validateRecaptcha, conditionalRecaptcha, captchaRateLimit } from '../middleware/recaptcha.js';
const router=express.Router()

// CSRF token endpoint
router.get("/csrf-token", getCSRFToken)

router.post("/signup", signUpRateLimit, verifyCSRFToken, validateRecaptcha({ required: true }), SignUp)
router.post("/signin", signInRateLimit, bruteForceProtection, verifyCSRFToken, conditionalRecaptcha((req) => {
    const identifier = req.ip || req.connection.remoteAddress;
    return getFailedAttempts(identifier) >= 3;
}), SignIn)
router.post("/google", signInRateLimit, bruteForceProtection, verifyCSRFToken, conditionalRecaptcha((req) => {
    const identifier = req.ip || req.connection.remoteAddress;
    return getFailedAttempts(identifier) >= 3;
}), Google)
router.get("/signout", Signout)
router.get("/verify", verifyAuth)
router.post("/forgot-password", forgotPasswordRateLimit, verifyCSRFToken, validateRecaptcha({ required: true }), forgotPassword)
router.post("/reset-password", verifyCSRFToken, resetPassword)

// Email verification routes
router.post("/send-otp", otpRateLimit, verifyCSRFToken, sendOTP)
router.post("/verify-otp", otpRateLimit, verifyCSRFToken, verifyOTP)
router.post("/send-forgot-password-otp", otpRateLimit, verifyCSRFToken, sendForgotPasswordOTP)
router.post("/send-profile-email-otp", otpRateLimit, verifyCSRFToken, sendProfileEmailOTP)

// OTP Login routes
router.post("/send-login-otp", otpRateLimit, verifyCSRFToken, sendLoginOTP)
router.post("/verify-login-otp", otpRateLimit, verifyCSRFToken, verifyLoginOTP)

// POST /api/auth/verify-password
router.post('/verify-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (isMatch) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router