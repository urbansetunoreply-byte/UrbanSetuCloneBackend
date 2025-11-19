import mongoose from "mongoose";

const rentalLoanSchema = new mongoose.Schema({
  // Loan Identification
  loanId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentLockContract',
    required: true,
    index: true
  },
  
  // Loan Details
  loanType: {
    type: String,
    enum: ['security_deposit', 'first_month_rent', 'maintenance_charges'],
    required: true,
    index: true
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  tenure: {
    type: Number, // in months
    required: true,
    min: 1,
    max: 60
  },
  
  // Partner Information
  partnerName: {
    type: String, // NBFC/Bank name
    required: true
  },
  partnerLoanId: {
    type: String,
    default: null
  },
  partnerContact: {
    email: String,
    phone: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'disbursed', 'rejected', 'repaid', 'defaulted'],
    default: 'pending',
    index: true
  },
  
  // EMI Details
  emiAmount: {
    type: Number,
    required: true,
    min: 0
  },
  emiSchedule: [{
    month: {
      type: Number, // 1-12
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'overdue'],
      default: 'pending'
    },
    paidAt: Date,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  // Documents
  documents: [{
    type: {
      type: String, // 'identity', 'income', 'bank_statement', 'contract', 'other'
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Eligibility Check
  eligibilityCheck: {
    passed: {
      type: Boolean,
      default: false
    },
    creditScore: Number,
    incomeVerified: {
      type: Boolean,
      default: false
    },
    employmentVerified: {
      type: Boolean,
      default: false
    },
    eligibilityScore: Number, // 0-100
    checkedAt: Date
  },
  
  // Approval/Rejection
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Disbursement
  disbursedAt: Date,
  disbursedAmount: Number,
  disbursementReference: String,
  
  // Repayment
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRemaining: {
    type: Number,
    min: 0
  },
  repaidAt: Date,
  
  // Default
  defaultedAt: Date,
  defaultReason: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
rentalLoanSchema.index({ userId: 1, status: 1 });
rentalLoanSchema.index({ contractId: 1 });
rentalLoanSchema.index({ status: 1, createdAt: -1 });
rentalLoanSchema.index({ 'emiSchedule.dueDate': 1, 'emiSchedule.status': 1 }); // For overdue EMI tracking

// Generate loanId before saving
rentalLoanSchema.pre('save', async function(next) {
  if (!this.loanId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.loanId = `LOAN-${timestamp}-${random}`;
  }
  
  // Calculate total remaining
  if (this.loanAmount && this.totalPaid !== undefined) {
    this.totalRemaining = Math.max(0, this.loanAmount - this.totalPaid);
  }
  
  this.updatedAt = Date.now();
  next();
});

// Generate EMI schedule
rentalLoanSchema.methods.generateEMISchedule = function() {
  const schedule = [];
  const startDate = new Date();
  const monthlyRate = this.interestRate / 100 / 12;
  const months = this.tenure;
  
  // Calculate EMI using formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
  const emi = (this.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  
  this.emiAmount = Math.round(emi);
  
  for (let i = 0; i < months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    const month = dueDate.getMonth() + 1;
    const year = dueDate.getFullYear();
    
    schedule.push({
      month: month,
      year: year,
      dueDate: dueDate,
      status: 'pending',
      penaltyAmount: 0
    });
  }
  
  this.emiSchedule = schedule;
};

// Virtual for overdue EMIs
rentalLoanSchema.virtual('overdueEMIs').get(function() {
  const now = new Date();
  return this.emiSchedule.filter(emi => 
    (emi.status === 'pending' || emi.status === 'overdue') &&
    new Date(emi.dueDate) < now
  );
});

// Virtual for next EMI due
rentalLoanSchema.virtual('nextEMIDue').get(function() {
  const now = new Date();
  const upcoming = this.emiSchedule.filter(emi => 
    emi.status === 'pending' &&
    new Date(emi.dueDate) >= now
  );
  return upcoming.length > 0 ? upcoming[0] : null;
});

// Method to calculate total outstanding
rentalLoanSchema.methods.getTotalOutstanding = function() {
  const overdueEMIs = this.overdueEMIs;
  const pendingEMIs = this.emiSchedule.filter(emi => emi.status === 'pending');
  
  const totalOverdue = overdueEMIs.reduce((sum, emi) => sum + this.emiAmount + (emi.penaltyAmount || 0), 0);
  const totalPending = pendingEMIs.length * this.emiAmount;
  
  return totalOverdue + totalPending;
};

const RentalLoan = mongoose.model("RentalLoan", rentalLoanSchema);

export default RentalLoan;

