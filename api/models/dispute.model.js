import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema({
  // Dispute Identification
  disputeId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentLockContract',
    required: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  raisedAgainst: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Dispute Details
  category: {
    type: String,
    enum: [
      'payment_issue',
      'property_maintenance',
      'behavior',
      'contract_violation',
      'damage_assessment',
      'early_termination',
      'other'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'text', 'payment_receipt'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed', 'escalated'],
    default: 'open',
    index: true
  },
  
  // Resolution
  resolution: {
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }, // admin
    decision: String,
    resolutionDate: Date,
    actionTaken: {
      type: String,
      enum: ['refund', 'penalty', 'warning', 'termination', 'no_action', 'partial_refund'],
      default: null
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    }, // if monetary action
    notes: String,
    resolutionDocumentUrl: String // PDF resolution document
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String],
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Escalation
  escalatedAt: Date,
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  escalationReason: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
}, {
  timestamps: true
});

// Indexes
disputeSchema.index({ contractId: 1, status: 1 });
disputeSchema.index({ raisedBy: 1, status: 1 });
disputeSchema.index({ status: 1, priority: 1, createdAt: -1 }); // For admin dashboard sorting
disputeSchema.index({ category: 1, status: 1 });

// Generate disputeId before saving
disputeSchema.pre('save', async function(next) {
  if (!this.disputeId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.disputeId = `DISPUTE-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual for unread messages count (for a specific user)
disputeSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(msg => 
    !msg.readBy.includes(userId) && 
    msg.sender.toString() !== userId.toString()
  ).length;
};

// Method to add message
disputeSchema.methods.addMessage = function(senderId, message, attachments = []) {
  this.messages.push({
    sender: senderId,
    message,
    timestamp: new Date(),
    attachments,
    readBy: [senderId] // Sender has read their own message
  });
  this.updatedAt = new Date();
};

// Method to mark messages as read
disputeSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(msg => {
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
    }
  });
  this.updatedAt = new Date();
};

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;

