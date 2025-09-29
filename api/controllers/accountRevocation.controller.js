import crypto from 'crypto';
import AccountRevocation from '../models/accountRevocation.model.js';
import DeletedAccount from '../models/deletedAccount.model.js';
import User from '../models/user.model.js';
import { sendAccountDeletionEmail, sendAccountActivationEmail } from '../utils/emailService.js';
import { errorHandler } from '../utils/error.js';

// Create revocation token for deleted account
export const createRevocationToken = async (req, res, next) => {
  try {
    const { accountId, email, username, role, originalData, reason } = req.body;

    // Generate secure random token
    const revocationToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create revocation record
    const revocationRecord = await AccountRevocation.create({
      accountId,
      email,
      username,
      role,
      revocationToken,
      expiresAt,
      originalData,
      reason
    });

    // Generate revocation link
    const revocationLink = `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/restore-account/${revocationToken}`;

    res.status(201).json({
      success: true,
      message: 'Revocation token created successfully',
      revocationLink,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating revocation token:', error);
    next(errorHandler(500, 'Failed to create revocation token'));
  }
};

// Verify revocation token
export const verifyRevocationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const revocationRecord = await AccountRevocation.findOne({
      revocationToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!revocationRecord) {
      return next(errorHandler(404, 'Invalid or expired token'));
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      accountData: {
        username: revocationRecord.username,
        email: revocationRecord.email,
        role: revocationRecord.role,
        deletedAt: revocationRecord.deletedAt,
        expiresAt: revocationRecord.expiresAt
      }
    });
  } catch (error) {
    console.error('Error verifying revocation token:', error);
    next(errorHandler(500, 'Failed to verify token'));
  }
};

// Restore account from revocation
export const restoreAccount = async (req, res, next) => {
  try {
    const { token } = req.body;

    const revocationRecord = await AccountRevocation.findOne({
      revocationToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!revocationRecord) {
      return next(errorHandler(404, 'Invalid or expired token'));
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: revocationRecord.email });
    if (existingUser) {
      return next(errorHandler(400, 'Account with this email already exists'));
    }

    // Restore user from original data
    const restoredUser = await User.create(revocationRecord.originalData);

    // Mark revocation token as used
    revocationRecord.isUsed = true;
    revocationRecord.usedAt = new Date();
    revocationRecord.restoredAt = new Date();
    await revocationRecord.save();

    // Remove from deleted accounts
    await DeletedAccount.findOneAndDelete({ email: revocationRecord.email });

    // Send activation email
    try {
      await sendAccountActivationEmail(revocationRecord.email, {
        username: revocationRecord.username,
        role: revocationRecord.role
      });
      console.log(`✅ Account activation email sent to: ${revocationRecord.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send activation email to ${revocationRecord.email}:`, emailError);
      // Don't fail the restoration if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Account restored successfully',
      user: {
        id: restoredUser._id,
        username: restoredUser.username,
        email: restoredUser.email,
        role: restoredUser.role
      }
    });
  } catch (error) {
    console.error('Error restoring account:', error);
    next(errorHandler(500, 'Failed to restore account'));
  }
};

// Get revocation status for admin
export const getRevocationStatus = async (req, res, next) => {
  try {
    const { email } = req.params;

    const revocationRecord = await AccountRevocation.findOne({ email }).sort({ createdAt: -1 });

    if (!revocationRecord) {
      return res.status(200).json({
        success: true,
        hasRevocation: false,
        message: 'No revocation record found'
      });
    }

    res.status(200).json({
      success: true,
      hasRevocation: true,
      revocationData: {
        username: revocationRecord.username,
        email: revocationRecord.email,
        role: revocationRecord.role,
        deletedAt: revocationRecord.deletedAt,
        expiresAt: revocationRecord.expiresAt,
        isUsed: revocationRecord.isUsed,
        usedAt: revocationRecord.usedAt,
        restoredAt: revocationRecord.restoredAt
      }
    });
  } catch (error) {
    console.error('Error getting revocation status:', error);
    next(errorHandler(500, 'Failed to get revocation status'));
  }
};
