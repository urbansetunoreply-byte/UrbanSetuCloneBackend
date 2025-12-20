import User from "../models/user.model.js";
import AdminLog from "../models/adminLog.model.js";
import { logSecurityEvent } from "../middleware/security.js";

/**
 * Advanced Fraud Detection Service
 * Implements intelligent heuristics and statistical scoring (Artificial Intelligence simulation).
 */
class FraudDetectionService {
    constructor() {
        // Velocity Configuration
        this.VELOCITY_WINDOW_MINUTES = 30; // Time window
        this.VELOCITY_THRESHOLD_COUNT_HARD = 5; // Instant block if met

        // Scoring Weights for AI Model
        // These weights determine how much each factor contributes to the final fraud score (0-1)
        this.WEIGHTS = {
            VELOCITY: 0.5,           // Rate of referrals
            ENTROPY: 0.2,            // Randomness of username/email
            EMAIL_PATTERN: 0.15,     // Suspicious email domains or aliasing
            METADATA_MISMATCH: 0.15  // Username != Email correlation
        };
    }

    /**
     * Main entry point for detecting referral fraud.
     * Analyzes velocity, patterns, and metadata to generate a comprehensive fraud score.
     */
    async checkReferralFraud(referrerId, newUserId) {
        try {
            const referrer = await User.findById(referrerId);
            const newUser = await User.findById(newUserId);

            if (!referrer || !newUser) return { isFraud: false };

            const timeWindowStart = new Date(Date.now() - this.VELOCITY_WINDOW_MINUTES * 60 * 1000);

            // 1. Data Collection
            const recentReferrals = await User.find({
                'gamification.referredBy': referrerId,
                createdAt: { $gte: timeWindowStart }
            }).sort({ createdAt: 1 });

            const velocityCount = recentReferrals.length;

            // --- FEATURE 1: VELOCITY CHECK (Hard Rule) ---
            if (velocityCount >= this.VELOCITY_THRESHOLD_COUNT_HARD) {
                return this.fraudResult(referrerId, newUserId, true, 'High Velocity (Hard Limit)', 1.0,
                    `User referred ${velocityCount} users in last ${this.VELOCITY_WINDOW_MINUTES}m.`);
            }

            // --- FEATURE 2: PATTERN MATCHING (Sequential Usernames) ---
            if (velocityCount >= 2) {
                const suspiciousPattern = this.detectNamingPattern(recentReferrals);
                if (suspiciousPattern) {
                    return this.fraudResult(referrerId, newUserId, true, 'Suspicious Naming Pattern', 0.9,
                        `Sequential usernames detected: ${suspiciousPattern}`);
                }
            }

            // --- FEATURE 3: AI MODEL SCORING (Multivariate Analysis) ---
            // We calculate independent scores for different vectors and aggregate them.

            // Vector A: Velocity Score (Sigmoid)
            const velocityScore = this.calculateVelocityScore(velocityCount);

            // Vector B: Entropy Score (Randomness of username)
            const entropyScore = this.calculateEntropyScore(newUser.username);

            // Vector C: Email Pattern Score (Disposable, Dot Usage, Gibberish)
            const emailScore = this.calculateEmailPatternScore(newUser.email);

            // Vector D: Metadata Mismatch (Username vs Email correlation)
            const mismatchScore = this.calculateMetadataMismatchScore(newUser.username, newUser.email);

            // Aggregated Weighted Score
            const finalScore = (
                (velocityScore * this.WEIGHTS.VELOCITY) +
                (entropyScore * this.WEIGHTS.ENTROPY) +
                (emailScore * this.WEIGHTS.EMAIL_PATTERN) +
                (mismatchScore * this.WEIGHTS.METADATA_MISMATCH)
            );

            // Threshold for "AI" detection
            // 0.65 suggests highly suspicious behavior behavior based on combined factors
            if (finalScore > 0.65) {
                const breakdown = `Velocity:${velocityScore.toFixed(2)}, Entropy:${entropyScore.toFixed(2)}, Email:${emailScore.toFixed(2)}, Mismatch:${mismatchScore.toFixed(2)}`;
                return this.fraudResult(referrerId, newUserId, true, 'AI Model Anomaly Detection', finalScore.toFixed(2),
                    `Irregular behavior pattern detected. Score breakdown: [${breakdown}]`);
            }

            return { isFraud: false, score: finalScore };

        } catch (error) {
            console.error("Fraud Detection Error:", error);
            return { isFraud: false };
        }
    }

    // --- HELPER METHODS & SCORING FUNCTIONS ---

    async fraudResult(referrerId, newUserId, isFraud, type, score, details) {
        if (isFraud) {
            await this.logFraudAttempt(referrerId, newUserId, type, details);
        }
        return { isFraud, reason: details, score };
    }

    detectNamingPattern(users) {
        const Usernames = users.map(u => u.username.toLowerCase());
        for (let i = 0; i < Usernames.length - 1; i++) {
            const u1 = Usernames[i];
            const u2 = Usernames[i + 1];
            const commonPrefix = this.getCommonPrefix(u1, u2);
            if (commonPrefix && commonPrefix.length > 3) {
                const rest1 = u1.slice(commonPrefix.length);
                const rest2 = u2.slice(commonPrefix.length);
                if (!isNaN(rest1) && !isNaN(rest2)) {
                    return `${u1}, ${u2}`;
                }
            }
        }
        return null;
    }

    getCommonPrefix(s1, s2) {
        let i = 0;
        while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++;
        return s1.slice(0, i);
    }

    calculateVelocityScore(count) {
        // Sigmoid center at 3 referrals/30mins
        const k = 1.5;
        const x0 = 3;
        return 1 / (1 + Math.exp(-k * (count - x0)));
    }

    calculateEntropyScore(username) {
        // Shannon entropy to detect key-mashing like "asdfghjk" or "qwe893"
        if (!username) return 0;

        const len = username.length;
        const frequencies = {};
        for (let char of username) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }

        let entropy = 0;
        for (let char in frequencies) {
            const p = frequencies[char] / len;
            entropy -= p * Math.log2(p);
        }

        // Normalized: High entropy (randomness) -> High score
        // Typical english word entropy is ~2.5 - 3.5. Random strings are > 4.0
        // We map entropy > 3.5 to high suspiciousness
        if (entropy > 3.8) return 1.0;
        if (entropy > 3.0) return 0.5;
        return 0.0;
    }

    calculateEmailPatternScore(email) {
        if (!email) return 0;
        let score = 0;
        const lower = email.toLowerCase();

        // 1. Detect Plus addressing (often used for multiple accounts: user+1@gmail)
        if (lower.includes('+')) score += 0.8;

        // 2. Detect excessive dot usage (v.i.j.a.y@gmail) - more than 3 dots in local part
        const localPart = lower.split('@')[0];
        const dotCount = (localPart.match(/\./g) || []).length;
        if (dotCount > 3) score += 0.6;

        // 3. Length check - extremely short or long local parts
        if (localPart.length < 5 || localPart.length > 30) score += 0.3;

        // 4. Number heavy
        const digitCount = (localPart.match(/\d/g) || []).length;
        if (digitCount / localPart.length > 0.6) score += 0.5; // >60% numbers

        return Math.min(score, 1.0);
    }

    calculateMetadataMismatchScore(username, email) {
        // Regular users often have correlation: 
        // User: "vijay", Email: "vijay.code@..."
        // Bots usually don't match: User: "bot123", Email: "random@..."

        if (!username || !email) return 0;

        const localPart = email.split('@')[0].toLowerCase();
        const userLower = username.toLowerCase();

        // Simple LCS (Longest Common Subsequence) or Inclusion check
        // If username is contained in email or vice versa, low mismatch score (good)
        // If totally different, high mismatch score (bad)

        if (localPart.includes(userLower) || userLower.includes(localPart)) {
            return 0.0; // Perfect match
        }

        // Simiilarity check (Levenstein-ish simplified)
        // If they share at least 4 contiguous characters, we consider it a match
        for (let i = 0; i < userLower.length - 3; i++) {
            const chunk = userLower.substring(i, i + 4);
            if (localPart.includes(chunk)) return 0.1; // partial match
        }

        return 1.0; // High mismatch
    }

    async logFraudAttempt(referrerId, newUserId, type, details) {
        console.warn(`🚨 AI FRAUD MODEL: [${type}] Blocked Reward. Ref:${referrerId} -> New:${newUserId}`);

        // 1. Log Security Event
        logSecurityEvent('ai_fraud_detected', {
            referrerId, newUserId, type, details
        });

        // 2. Create Admin Log
        try {
            const referrer = await User.findById(referrerId);
            const newUser = await User.findById(newUserId);

            await AdminLog.create({
                adminId: null,
                action: 'FRAUD_ALERT',
                targetModel: 'User',
                targetId: referrerId,
                details: `AI Model blocked reward. ${details}`,
                metadata: {
                    flaggedUser: referrer ? referrer.username : 'Unknown',
                    fakeAccount: newUser ? newUser.username : 'Unknown',
                    detectionType: type
                },
                ip: 'SYSTEM',
                userAgent: 'UrbanSetu_Sentinel_AI/2.0'
            });
        } catch (e) {
            console.error("Failed to creat admin log:", e);
        }
    }
}

export default new FraudDetectionService();
