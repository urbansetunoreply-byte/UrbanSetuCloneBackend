import mongoose from 'mongoose';

const passwordLockoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: false
  },
  email: {
    type: String,
    index: true,
    required: false,
    lowercase: true
  },
  identifier: {
    type: String,
    index: true,
    required: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  lockedAt: {
    type: Date,
    default: null
  },
  unlockAt: {
    type: Date,
    default: null,
    index: true
  },
  ipAddress: {
    type: String,
    required: false
  }
}, { timestamps: true });

passwordLockoutSchema.statics.lockUser = async function({ userId, email, identifier, durationMs, attempts = 0, ipAddress }) {
  const now = new Date();
  const unlockAt = new Date(now.getTime() + durationMs);
  const update = {
    userId: userId || undefined,
    email: email ? email.toLowerCase() : undefined,
    identifier,
    attempts,
    lockedAt: now,
    unlockAt,
    ipAddress
  };
  const filter = userId ? { userId } : (email ? { email: email.toLowerCase() } : { identifier });
  return this.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
};

passwordLockoutSchema.statics.clearUserLock = async function({ userId, email, identifier }) {
  const filter = userId ? { userId } : (email ? { email: email.toLowerCase() } : { identifier });
  return this.deleteMany(filter);
};

passwordLockoutSchema.statics.isLocked = async function({ userId, email }) {
  const now = new Date();
  const filter = userId ? { userId } : { email: email.toLowerCase() };
  const lock = await this.findOne({ ...filter, unlockAt: { $gt: now } });
  return !!lock;
};

passwordLockoutSchema.statics.getRemainingMs = async function({ userId, email }) {
  const now = new Date();
  const filter = userId ? { userId } : { email: email.toLowerCase() };
  const lock = await this.findOne({ ...filter, unlockAt: { $gt: now } });
  return lock ? (lock.unlockAt.getTime() - now.getTime()) : 0;
};

const PasswordLockout = mongoose.model('PasswordLockout', passwordLockoutSchema);
export default PasswordLockout;
