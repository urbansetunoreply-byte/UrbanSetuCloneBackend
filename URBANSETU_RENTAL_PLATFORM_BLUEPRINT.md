# 🏗️ **UrbanSetu Rental Platform - Complete Implementation Blueprint**

## 📋 **EXECUTIVE SUMMARY**

This document provides a comprehensive blueprint for implementing the UrbanSetu Rental Platform with Rent-Lock Guarantee Plans. It maps existing codebase components to new features, defines new pages/components needed, database models, API routes, and implementation flows.

---

## 🎯 **CORE CONCEPT**

**UrbanSetu** - A rental platform that guarantees fixed rent through Rent-Lock Plans, handles all payments via platform-controlled escrow, provides AI rent prediction, smart locality scoring, and comprehensive dispute resolution.

**USP:** "Fixed Rent, Zero Fraud, Fully Transparent Rentals"

---

## 📊 **DATABASE MODELS (New + Extensions)**

### **1. NEW MODELS TO CREATE**

#### **A. `api/models/rentLockContract.model.js`**
```javascript
{
  contractId: String (unique, indexed),
  bookingId: ObjectId (ref: 'Booking'),
  listingId: ObjectId (ref: 'Listing'),
  tenantId: ObjectId (ref: 'User'), // buyerId in Booking
  landlordId: ObjectId (ref: 'User'), // sellerId in Booking
  
  // Rent Lock Details
  rentLockPlan: {
    type: String,
    enum: ['1_year', '3_year', '5_year', 'custom'],
    required: true
  },
  lockDuration: Number, // in months
  lockedRentAmount: Number, // Fixed monthly rent
  startDate: Date,
  endDate: Date,
  
  // Payment Terms
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'monthly'
  },
  dueDate: Number, // Day of month (1-31)
  securityDeposit: Number,
  securityDepositPaid: Boolean,
  maintenanceCharges: Number, // Optional monthly
  advanceRent: Number, // Optional advance months
  
  // Penalties
  lateFeePercentage: Number, // Default 5%
  earlyTerminationFee: Number,
  defaultPenalty: Number,
  
  // Contract Status
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed'],
    default: 'pending_signature'
  },
  
  // Digital Signatures
  tenantSignature: {
    signed: Boolean,
    signedAt: Date,
    ipAddress: String,
    userAgent: String
  },
  landlordSignature: {
    signed: Boolean,
    signedAt: Date,
    ipAddress: String,
    userAgent: String
  },
  
  // Auto-renewal
  autoRenew: Boolean,
  renewalNoticeDays: Number, // Default 30 days before expiry
  
  // Move-in/Move-out
  moveInDate: Date,
  moveOutDate: Date,
  moveInChecklistCompleted: Boolean,
  moveOutChecklistCompleted: Boolean,
  
  // Termination
  terminatedAt: Date,
  terminationReason: String,
  terminationBy: ObjectId (ref: 'User'),
  
  // Metadata
  contractDocumentUrl: String, // PDF contract
  termsAndConditions: String, // Stored text version
  createdAt: Date,
  updatedAt: Date
}
```

#### **B. `api/models/rentWallet.model.js`**
```javascript
{
  walletId: String (unique, indexed),
  userId: ObjectId (ref: 'User'),
  contractId: ObjectId (ref: 'RentLockContract'),
  
  // Wallet Balance
  currentBalance: Number, // Available balance
  pendingPayments: Number, // Upcoming rent
  totalPaid: Number, // Total rent paid
  totalDue: Number, // Total pending
  
  // Auto-debit Settings
  autoDebitEnabled: Boolean,
  autoDebitMethod: {
    type: String,
    enum: ['razorpay', 'paypal', 'bank_account', 'upi']
  },
  autoDebitDay: Number, // Day of month for auto-debit
  paymentMethodToken: String, // Encrypted payment method token
  
  // Payment Schedule
  paymentSchedule: [{
    month: Number, // 1-12
    year: Number,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'processing', 'completed', 'failed', 'overdue']
    },
    paidAt: Date,
    paymentId: ObjectId (ref: 'Payment'),
    penaltyAmount: Number,
    remarks: String
  }],
  
  // Notifications
  reminderSent: Boolean,
  reminderSentAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### **C. `api/models/moveInOutChecklist.model.js`**
```javascript
{
  checklistId: String (unique, indexed),
  contractId: ObjectId (ref: 'RentLockContract'),
  type: {
    type: String,
    enum: ['move_in', 'move_out'],
    required: true
  },
  
  // Property Condition
  images: [{
    url: String,
    room: String, // 'living_room', 'bedroom', 'kitchen', etc.
    description: String,
    uploadedAt: Date,
    uploadedBy: ObjectId (ref: 'User')
  }],
  videos: [{
    url: String,
    room: String,
    description: String,
    uploadedAt: Date,
    uploadedBy: ObjectId (ref: 'User')
  }],
  
  // Room-wise Checklist
  rooms: [{
    roomName: String,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
    },
    notes: String,
    damages: [{
      description: String,
      estimatedCost: Number,
      imageUrl: String,
      acknowledgedBy: ObjectId (ref: 'User'),
      acknowledgedAt: Date
    }]
  }],
  
  // Amenities Checklist
  amenities: [{
    name: String, // 'furniture', 'appliances', 'fixtures'
    condition: String,
    working: Boolean,
    notes: String
  }],
  
  // Signatures
  landlordApproved: Boolean,
  landlordApprovedAt: Date,
  tenantApproved: Boolean,
  tenantApprovedAt: Date,
  
  // Comparison (for move-out)
  damageAssessment: {
    totalDamageCost: Number,
    deductedFromDeposit: Number,
    repairRequired: [String],
    images: [String]
  },
  
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **D. `api/models/dispute.model.js`**
```javascript
{
  disputeId: String (unique, indexed),
  contractId: ObjectId (ref: 'RentLockContract'),
  raisedBy: ObjectId (ref: 'User'), // tenant or landlord
  raisedAgainst: ObjectId (ref: 'User'),
  
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
    required: true
  },
  title: String,
  description: String,
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'text', 'payment_receipt']
    },
    url: String,
    description: String,
    uploadedAt: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  
  // Resolution
  resolution: {
    decidedBy: ObjectId (ref: 'User'), // admin
    decision: String,
    resolutionDate: Date,
    actionTaken: String, // 'refund', 'penalty', 'warning', 'termination'
    amount: Number, // if monetary action
    notes: String
  },
  
  // Communication
  messages: [{
    sender: ObjectId (ref: 'User'),
    message: String,
    timestamp: Date,
    attachments: [String]
  }],
  
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date
}
```

#### **E. `api/models/propertyVerification.model.js`**
```javascript
{
  verificationId: String (unique, indexed),
  listingId: ObjectId (ref: 'Listing'),
  landlordId: ObjectId (ref: 'User'),
  
  // Verification Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'verified', 'rejected'],
    default: 'pending'
  },
  
  // Documents Verified
  documents: {
    ownershipProof: {
      verified: Boolean,
      documentUrl: String,
      verifiedAt: Date,
      verifiedBy: ObjectId (ref: 'User') // admin
    },
    identityProof: {
      verified: Boolean,
      documentUrl: String,
      verifiedAt: Date,
      verifiedBy: ObjectId (ref: 'User')
    },
    addressProof: {
      verified: Boolean,
      documentUrl: String,
      verifiedAt: Date,
      verifiedBy: ObjectId (ref: 'User')
    }
  },
  
  // Property Inspection
  photosVerified: Boolean,
  locationVerified: Boolean,
  amenitiesVerified: Boolean,
  
  // Verification Badge
  verifiedBadgeIssued: Boolean,
  badgeIssuedAt: Date,
  badgeExpiry: Date, // Annual renewal
  
  // Payment
  verificationFee: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded']
  },
  
  // Rejection
  rejectionReason: String,
  rejectedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### **F. `api/models/rentalRating.model.js`**
```javascript
{
  ratingId: String (unique, indexed),
  contractId: ObjectId (ref: 'RentLockContract'),
  
  // Tenant rates Landlord
  tenantToLandlordRating: {
    overallRating: Number, // 1-5
    behaviorRating: Number,
    maintenanceRating: Number,
    honestyRating: Number,
    communicationRating: Number,
    comment: String,
    ratedAt: Date
  },
  
  // Landlord rates Tenant
  landlordToTenantRating: {
    overallRating: Number,
    cleanlinessRating: Number,
    paymentPunctuality: Number,
    behaviorRating: Number,
    propertyCare: Number,
    comment: String,
    ratedAt: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

#### **G. `api/models/rentPrediction.model.js`**
```javascript
{
  predictionId: String (unique, indexed),
  listingId: ObjectId (ref: 'Listing'),
  
  // AI Predictions
  predictedRent: Number, // AI suggested rent
  marketAverageRent: Number, // Average in locality
  priceComparison: {
    type: String,
    enum: ['overpriced', 'fair', 'underpriced']
  },
  priceDifference: Number, // % difference from market average
  
  // Market Trends
  predictedFutureRent: [{
    year: Number,
    predictedRent: Number,
    confidence: Number // 0-100
  }],
  
  // Factors
  influencingFactors: [{
    factor: String, // 'location', 'amenities', 'size', etc.
    impact: Number, // -100 to 100
    description: String
  }],
  
  // Locality Score
  localityScore: {
    safety: Number,
    accessibility: Number,
    waterAvailability: Number,
    schools: Number,
    offices: Number,
    traffic: Number,
    grocery: Number,
    medical: Number,
    shopping: Number,
    overall: Number
  },
  
  predictedAt: Date,
  modelVersion: String,
  accuracy: Number
}
```

#### **H. `api/models/rentalLoan.model.js`**
```javascript
{
  loanId: String (unique, indexed),
  userId: ObjectId (ref: 'User'),
  contractId: ObjectId (ref: 'RentLockContract'),
  
  // Loan Details
  loanType: {
    type: String,
    enum: ['security_deposit', 'first_month_rent', 'maintenance_charges'],
    required: true
  },
  loanAmount: Number,
  interestRate: Number,
  tenure: Number, // in months
  
  // Partner Info
  partnerName: String, // NBFC/Bank name
  partnerLoanId: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'disbursed', 'rejected', 'repaid', 'defaulted']
  },
  
  // EMI Details
  emiAmount: Number,
  emiSchedule: [{
    month: Number,
    year: Number,
    dueDate: Date,
    status: String,
    paidAt: Date
  }],
  
  // Documents
  documents: [String], // URLs
  
  approvedAt: Date,
  disbursedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **2. EXISTING MODELS TO EXTEND**

#### **A. `api/models/listing.model.js` - EXTEND**
```javascript
// ADD these fields to existing listingSchema:

rentLockPlans: {
  availablePlans: [{
    type: String,
    enum: ['1_year', '3_year', '5_year', 'custom']
  }],
  defaultPlan: {
    type: String,
    enum: ['1_year', '3_year', '5_year', 'custom'],
    default: '1_year'
  }
},

// Rent-specific fields
monthlyRent: Number, // Primary rent amount
securityDepositMonths: Number, // Usually 2-3 months
maintenanceCharges: Number, // Optional monthly
advanceRentMonths: Number, // Optional advance

// Property Verification
isVerified: Boolean,
verificationId: ObjectId (ref: 'PropertyVerification'),

// Locality Score (pre-computed)
localityScore: {
  safety: Number,
  accessibility: Number,
  waterAvailability: Number,
  schools: Number,
  offices: Number,
  traffic: Number,
  grocery: Number,
  medical: Number,
  shopping: Number,
  overall: Number
},

// Rent Prediction
rentPrediction: {
  predictedRent: Number,
  marketAverage: Number,
  priceComparison: String,
  lastUpdated: Date
}
```

#### **B. `api/models/booking.model.js` - EXTEND**
```javascript
// ADD these fields to existing bookingSchema:

// Rent-Lock Specific
rentLockPlanSelected: {
  type: String,
  enum: ['1_year', '3_year', '5_year', 'custom']
},
customLockDuration: Number, // in months, if custom plan

// Contract
contractId: ObjectId (ref: 'RentLockContract'),

// Rental Status
rentalStatus: {
  type: String,
  enum: ['pending_contract', 'contract_signed', 'move_in_pending', 'active_rental', 'move_out_pending', 'completed', 'terminated']
},

// Move Dates
moveInDate: Date,
moveOutDate: Date,

// Security Deposit
securityDepositPaid: Boolean,
securityDepositAmount: Number,

// Rent Wallet
walletId: ObjectId (ref: 'RentWallet')
```

#### **C. `api/models/payment.model.js` - ALREADY HAS monthly_rent**
```javascript
// ALREADY EXISTS: paymentType: 'monthly_rent'
// Just ensure it's properly used for rental payments

// ADD for rental payments:
rentMonth: Number, // 1-12
rentYear: Number,
contractId: ObjectId (ref: 'RentLockContract'),
walletId: ObjectId (ref: 'RentWallet'),
penaltyAmount: Number,
isAutoDebit: Boolean
```

#### **D. `api/models/user.model.js` - EXTEND**
```javascript
// ADD these fields to existing userSchema:

// Rental Profile
rentalProfile: {
  isTenant: Boolean,
  isLandlord: Boolean,
  activeContractsAsTenant: Number,
  activeContractsAsLandlord: Number,
  totalRentPaid: Number,
  totalRentReceived: Number,
  averageTenantRating: Number,
  averageLandlordRating: Number,
  verifiedLandlord: Boolean
},

// Auto-debit Settings
autoDebitSettings: {
  enabled: Boolean,
  defaultMethod: String,
  defaultDay: Number
}
```

---

## 🗂️ **PAGE/COMPONENT MAPPING**

### **1. EXISTING PAGES TO EXTEND**

#### **A. `web/src/pages/CreateListing.jsx` - EXTEND**
**Location:** Add Rent-Lock Plan Selection section
**Changes:**
- After "Type" selection (rent/sale), add Rent-Lock Plan selector
- Only show if `type === 'rent'`
- Fields to add:
  - Rent-Lock Plan dropdown: 1 Year, 3 Year, 5 Year, Custom
  - If Custom: Duration input (months)
  - Security Deposit (months of rent)
  - Maintenance Charges (optional)
  - Advance Rent (optional months)
- Save to `listing.rentLockPlans`

**Implementation:**
```jsx
{formData.type === 'rent' && (
  <div className="border-t pt-4 mt-4">
    <h3 className="text-lg font-semibold mb-4">Rent-Lock Plan Configuration</h3>
    <select name="rentLockPlan" value={formData.rentLockPlan} onChange={handleChange}>
      <option value="1_year">1 Year Rent-Lock</option>
      <option value="3_year">3 Year Rent-Lock</option>
      <option value="5_year">5 Year Rent-Lock</option>
      <option value="custom">Custom Duration</option>
    </select>
    {formData.rentLockPlan === 'custom' && (
      <input type="number" name="customLockDuration" placeholder="Duration (months)" />
    )}
    <input type="number" name="securityDepositMonths" placeholder="Security Deposit (months)" />
    <input type="number" name="maintenanceCharges" placeholder="Maintenance Charges (₹/month)" />
  </div>
)}
```

#### **B. `web/src/pages/EditListing.jsx` - EXTEND**
**Location:** Same as CreateListing
**Changes:** Same rent-lock fields, pre-populated with existing values

#### **C. `web/src/pages/Listing.jsx` - EXTEND**
**Location:** Property details display section
**Changes:**
- Display Rent-Lock badge if `listing.type === 'rent'`
- Show available rent-lock plans
- Display Locality Score (new component)
- Show AI Rent Prediction (if available)
- Display Property Verification badge if verified
- Add "Rent This Property" button (different from "Book Appointment")

**Implementation:**
```jsx
{listing.type === 'rent' && (
  <>
    {/* Rent-Lock Badge */}
    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg mb-4">
      <FaLock className="inline mr-2" />
      <span className="font-semibold">Rent-Lock Available: {listing.rentLockPlans?.defaultPlan}</span>
    </div>
    
    {/* Locality Score Component */}
    <LocalityScoreDisplay score={listing.localityScore} />
    
    {/* AI Rent Prediction */}
    <RentPredictionDisplay prediction={listing.rentPrediction} currentRent={listing.monthlyRent} />
    
    {/* Verified Badge */}
    {listing.isVerified && (
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
        <FaCheckCircle className="inline mr-2" />
        Verified Property
      </div>
    )}
    
    {/* Rent Button */}
    <button onClick={() => navigate(`/rent-property?listingId=${listing._id}`)}>
      Rent This Property
    </button>
  </>
)}
```

#### **D. `web/src/components/ListingItem.jsx` - EXTEND**
**Location:** Property card display
**Changes:**
- Show rent-lock badge if rental property
- Display verification badge
- Show locality score (mini display)

#### **E. `web/src/components/Appointment.jsx` - EXTEND**
**Location:** Booking form
**Changes:**
- If `purpose === 'rent'`, show Rent-Lock Plan selector
- Show contract preview before submission
- Add security deposit field
- Add move-in date selector

#### **F. `web/src/pages/MyAppointments.jsx` - EXTEND**
**Location:** Appointment list item
**Changes:**
- Show rental status badge
- Add "View Contract" button for rentals
- Show "Rent Wallet" link if active rental
- Display move-in/move-out dates

#### **G. `web/src/pages/PaymentDashboard.jsx` - EXTEND**
**Location:** Payment overview
**Changes:**
- Add "Rent Wallet" tab
- Show monthly rent schedule
- Display auto-debit status
- Show upcoming rent payments
- Add rent payment history

#### **H. `web/src/components/PaymentModal.jsx` - EXTEND**
**Location:** Payment processing
**Changes:**
- Support monthly rent payments
- Add rent wallet payment option
- Show contract terms before payment

---

### **2. NEW PAGES TO CREATE**

#### **A. `web/src/pages/RentProperty.jsx` - NEW**
**Purpose:** Property rental booking page
**Route:** `/user/rent-property?listingId=xxx` or `/rent-property?listingId=xxx`
**Features:**
- Property details summary
- Rent-Lock plan selection
- Contract terms preview
- Security deposit calculation
- Move-in date selection
- Digital contract signing
- Payment integration
- Steps:
  1. Select Rent-Lock Plan
  2. Review Contract Terms
  3. Sign Contract (tenant + landlord)
  4. Pay Security Deposit + First Month Rent
  5. Move-in Checklist

**File Structure:**
```jsx
// web/src/pages/RentProperty.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RentLockPlanSelector from '../components/rental/RentLockPlanSelector';
import ContractPreview from '../components/rental/ContractPreview';
import DigitalSignature from '../components/rental/DigitalSignature';
import PaymentModal from '../components/PaymentModal';
import MoveInChecklist from '../components/rental/MoveInChecklist';

export default function RentProperty() {
  // State for rental flow
  // Steps: plan_selection -> contract_review -> signing -> payment -> move_in
}
```

#### **B. `web/src/pages/RentWallet.jsx` - NEW**
**Purpose:** Tenant rent wallet management
**Route:** `/user/rent-wallet` or `/rent-wallet`
**Features:**
- Current wallet balance
- Auto-debit settings
- Payment schedule (calendar view)
- Payment history
- Upcoming payments
- Overdue payments
- Payment reminders
- Receipts download

**File Structure:**
```jsx
// web/src/pages/RentWallet.jsx
import React, { useState, useEffect } from 'react';
import RentWalletOverview from '../components/rental/RentWalletOverview';
import PaymentSchedule from '../components/rental/PaymentSchedule';
import AutoDebitSettings from '../components/rental/AutoDebitSettings';
import RentPaymentHistory from '../components/rental/RentPaymentHistory';
```

#### **C. `web/src/pages/RentalContracts.jsx` - NEW**
**Purpose:** View/manage rental contracts
**Route:** `/user/rental-contracts` or `/rental-contracts`
**Features:**
- List all active/past contracts
- View contract details
- Download contract PDF
- Renew contract
- Terminate contract
- Move-out request

**File Structure:**
```jsx
// web/src/pages/RentalContracts.jsx
import React, { useState, useEffect } from 'react';
import ContractList from '../components/rental/ContractList';
import ContractDetailView from '../components/rental/ContractDetailView';
import ContractRenewalModal from '../components/rental/ContractRenewalModal';
```

#### **D. `web/src/pages/MoveInOut.jsx` - NEW**
**Purpose:** Move-in/Move-out checklist management
**Route:** `/user/move-in-out?contractId=xxx&type=move_in`
**Features:**
- Upload property condition images/videos
- Room-wise checklist
- Amenities checklist
- Digital approval (tenant + landlord)
- Damage assessment (for move-out)
- Auto-deduct damages from security deposit

**File Structure:**
```jsx
// web/src/pages/MoveInOut.jsx
import React, { useState } from 'react';
import ChecklistForm from '../components/rental/ChecklistForm';
import ImageUploader from '../components/rental/ImageUploader';
import DamageAssessment from '../components/rental/DamageAssessment';
```

#### **E. `web/src/pages/DisputeResolution.jsx` - NEW**
**Purpose:** Dispute submission and tracking
**Route:** `/user/disputes` or `/disputes`
**Features:**
- Submit dispute
- Upload evidence (images, videos, documents)
- Track dispute status
- Chat with admin/dispute team
- View resolution
- Appeal resolution

**File Structure:**
```jsx
// web/src/pages/DisputeResolution.jsx
import React, { useState, useEffect } from 'react';
import DisputeList from '../components/rental/DisputeList';
import DisputeForm from '../components/rental/DisputeForm';
import DisputeDetailView from '../components/rental/DisputeDetailView';
import EvidenceUploader from '../components/rental/EvidenceUploader';
```

#### **F. `web/src/pages/PropertyVerification.jsx` - NEW**
**Purpose:** Property verification request
**Route:** `/user/property-verification?listingId=xxx`
**Features:**
- Upload ownership documents
- Upload identity proof
- Upload address proof
- Pay verification fee
- Track verification status
- View verification badge

**File Structure:**
```jsx
// web/src/pages/PropertyVerification.jsx
import React, { useState } from 'react';
import DocumentUploader from '../components/verification/DocumentUploader';
import VerificationStatus from '../components/verification/VerificationStatus';
import PaymentModal from '../components/PaymentModal';
```

#### **G. `web/src/pages/RentalRatings.jsx` - NEW**
**Purpose:** Rate tenant/landlord after rental
**Route:** `/user/rental-ratings`
**Features:**
- Rate tenant (for landlords)
- Rate landlord (for tenants)
- View ratings received
- Rating breakdown by category

**File Structure:**
```jsx
// web/src/pages/RentalRatings.jsx
import React, { useState, useEffect } from 'react';
import RatingForm from '../components/rental/RatingForm';
import RatingDisplay from '../components/rental/RatingDisplay';
```

#### **H. `web/src/pages/RentalLoans.jsx` - NEW**
**Purpose:** Apply for rental loans
**Route:** `/user/rental-loans`
**Features:**
- Loan application form
- Loan eligibility check
- Partner selection (NBFCs)
- EMI calculator
- Loan status tracking
- EMI payment schedule

**File Structure:**
```jsx
// web/src/pages/RentalLoans.jsx
import React, { useState } from 'react';
import LoanApplicationForm from '../components/loans/LoanApplicationForm';
import LoanEligibilityCheck from '../components/loans/LoanEligibilityCheck';
import EMICalculator from '../components/EMICalculator';
import LoanStatusTracker from '../components/loans/LoanStatusTracker';
```

#### **I. `web/src/pages/AdminRentalManagement.jsx` - NEW**
**Purpose:** Admin panel for rental management
**Route:** `/admin/rental-management`
**Features:**
- View all rental contracts
- Monitor rent payments
- Handle disputes
- Property verification approvals
- Rental analytics

**File Structure:**
```jsx
// web/src/pages/AdminRentalManagement.jsx
import React, { useState, useEffect } from 'react';
import RentalContractList from '../components/admin/RentalContractList';
import DisputeManagement from '../components/admin/DisputeManagement';
import VerificationApproval from '../components/admin/VerificationApproval';
import RentalAnalytics from '../components/admin/RentalAnalytics';
```

---

### **3. NEW COMPONENTS TO CREATE**

#### **Rental Components Directory: `web/src/components/rental/`**

1. **`RentLockPlanSelector.jsx`** - Select rent-lock plan
2. **`ContractPreview.jsx`** - Preview digital contract
3. **`DigitalSignature.jsx`** - Sign contract digitally
4. **`RentWalletOverview.jsx`** - Wallet balance and stats
5. **`PaymentSchedule.jsx`** - Calendar view of payments
6. **`AutoDebitSettings.jsx`** - Configure auto-debit
7. **`RentPaymentHistory.jsx`** - Payment history list
8. **`ContractList.jsx`** - List of contracts
9. **`ContractDetailView.jsx`** - Contract details
10. **`ContractRenewalModal.jsx`** - Renew contract modal
11. **`ChecklistForm.jsx`** - Move-in/out checklist form
12. **`ImageUploader.jsx`** - Upload property images
13. **`DamageAssessment.jsx`** - Calculate damages
14. **`DisputeList.jsx`** - List disputes
15. **`DisputeForm.jsx`** - Submit dispute
16. **`DisputeDetailView.jsx`** - Dispute details
17. **`EvidenceUploader.jsx`** - Upload evidence
18. **`LocalityScoreDisplay.jsx`** - Show locality score
19. **`RentPredictionDisplay.jsx`** - Show AI rent prediction
20. **`RatingForm.jsx`** - Rate tenant/landlord
21. **`RatingDisplay.jsx`** - Display ratings
22. **`VerificationBadge.jsx`** - Verification badge component

#### **Admin Components Directory: `web/src/components/admin/`**

23. **`RentalContractList.jsx`** - Admin contract list
24. **`DisputeManagement.jsx`** - Admin dispute resolution
25. **`VerificationApproval.jsx`** - Approve verifications
26. **`RentalAnalytics.jsx`** - Rental analytics dashboard

#### **Loan Components Directory: `web/src/components/loans/`**

27. **`LoanApplicationForm.jsx`** - Apply for loan
28. **`LoanEligibilityCheck.jsx`** - Check eligibility
29. **`LoanStatusTracker.jsx`** - Track loan status

#### **Verification Components Directory: `web/src/components/verification/`**

30. **`DocumentUploader.jsx`** - Upload verification documents
31. **`VerificationStatus.jsx`** - Show verification status

---

## 🔌 **API ROUTES (New + Extensions)**

### **1. NEW ROUTE FILES**

#### **A. `api/routes/rental.route.js` - NEW**
```javascript
// Rent-Lock Contract Routes
POST   /api/rental/contracts/create              // Create contract
GET    /api/rental/contracts                     // List contracts
GET    /api/rental/contracts/:contractId         // Get contract details
PUT    /api/rental/contracts/:contractId         // Update contract
POST   /api/rental/contracts/:contractId/sign    // Sign contract (tenant/landlord)
POST   /api/rental/contracts/:contractId/renew   // Renew contract
POST   /api/rental/contracts/:contractId/terminate // Terminate contract
GET    /api/rental/contracts/:contractId/download // Download PDF
DELETE /api/rental/contracts/:contractId         // Delete contract

// Rent Wallet Routes
GET    /api/rental/wallet                        // Get wallet details
POST   /api/rental/wallet/auto-debit             // Enable/disable auto-debit
PUT    /api/rental/wallet/auto-debit             // Update auto-debit settings
GET    /api/rental/wallet/payment-schedule       // Get payment schedule
GET    /api/rental/wallet/payment-history        // Get payment history
POST   /api/rental/wallet/pay-rent               // Manual rent payment

// Move-In/Move-Out Routes
POST   /api/rental/checklist/create              // Create checklist
GET    /api/rental/checklist/:checklistId        // Get checklist
PUT    /api/rental/checklist/:checklistId        // Update checklist
POST   /api/rental/checklist/:checklistId/approve // Approve checklist
POST   /api/rental/checklist/:checklistId/compare // Compare move-in vs move-out
POST   /api/rental/checklist/:checklistId/damage-assessment // Assess damages

// Dispute Routes
POST   /api/rental/disputes                      // Create dispute
GET    /api/rental/disputes                      // List disputes
GET    /api/rental/disputes/:disputeId           // Get dispute details
POST   /api/rental/disputes/:disputeId/evidence  // Upload evidence
POST   /api/rental/disputes/:disputeId/resolve   // Resolve dispute (admin)
PUT    /api/rental/disputes/:disputeId           // Update dispute

// Rental Ratings Routes
POST   /api/rental/ratings                       // Submit rating
GET    /api/rental/ratings/:contractId           // Get ratings for contract
GET    /api/rental/ratings/user/:userId          // Get user ratings

// Property Verification Routes
POST   /api/rental/verification/request          // Request verification
GET    /api/rental/verification/:verificationId  // Get verification status
POST   /api/rental/verification/:verificationId/approve // Approve (admin)
POST   /api/rental/verification/:verificationId/reject  // Reject (admin)

// Rent Prediction Routes
GET    /api/rental/prediction/:listingId         // Get rent prediction
POST   /api/rental/prediction/calculate          // Calculate prediction

// Locality Score Routes
GET    /api/rental/locality-score/:listingId     // Get locality score
POST   /api/rental/locality-score/calculate      // Calculate score
```

#### **B. `api/routes/loan.route.js` - NEW**
```javascript
POST   /api/loans/apply                          // Apply for loan
GET    /api/loans/eligibility                    // Check eligibility
GET    /api/loans/:loanId                        // Get loan details
GET    /api/loans                                // List user loans
POST   /api/loans/:loanId/approve                // Approve loan (partner/admin)
POST   /api/loans/:loanId/disburse               // Disburse loan
GET    /api/loans/:loanId/emi-schedule           // Get EMI schedule
POST   /api/loans/:loanId/pay-emi                // Pay EMI
```

### **2. EXISTING ROUTES TO EXTEND**

#### **A. `api/routes/payment.route.js` - EXTEND**
```javascript
// Already has: POST /api/payments/monthly-rent
// EXTEND to support:
- Auto-debit rent payments
- Rent wallet integration
- Contract-based payments
- Penalty calculations
- Escrow handling
```

#### **B. `api/routes/booking.route.js` - EXTEND**
```javascript
// ADD:
POST   /api/bookings/rent                        // Create rental booking
PUT    /api/bookings/:bookingId/rent-lock-plan   // Update rent-lock plan
GET    /api/bookings/rental/:bookingId           // Get rental booking details
```

#### **C. `api/routes/listing.route.js` - EXTEND**
```javascript
// ADD:
GET    /api/listing/:listingId/rent-lock-plans   // Get available plans
GET    /api/listing/:listingId/locality-score    // Get locality score
GET    /api/listing/:listingId/rent-prediction   // Get rent prediction
PUT    /api/listing/:listingId/verification      // Update verification status
```

---

## 🔄 **USER FLOWS**

### **FLOW 1: Property Listing (Seller)**
```
1. Seller creates listing → CreateListing.jsx
2. Selects "Rent" type
3. Chooses Rent-Lock Plan (1/3/5 years or custom)
4. Sets monthly rent, security deposit, maintenance
5. Optionally requests Property Verification
6. Submits listing
7. Listing appears with Rent-Lock badge
```

### **FLOW 2: Rent Property (Tenant)**
```
1. Tenant views property → Listing.jsx
2. Clicks "Rent This Property" → RentProperty.jsx
3. Step 1: Select Rent-Lock Plan
4. Step 2: Review Contract Terms (ContractPreview.jsx)
5. Step 3: Sign Contract Digitally (DigitalSignature.jsx)
   - Tenant signs
   - Landlord receives notification
   - Landlord signs
6. Step 4: Payment (PaymentModal.jsx)
   - Pay Security Deposit
   - Pay First Month Rent
   - Money goes to escrow
7. Step 5: Move-In Checklist (MoveInOut.jsx)
   - Upload property condition images
   - Landlord approves
   - Tenant approves
8. Contract becomes ACTIVE
9. Rent Wallet is created
10. Auto-debit is set up (optional)
```

### **FLOW 3: Monthly Rent Payment**
```
1. Rent due date approaches
2. System sends reminder (email + in-app)
3. Option A: Auto-debit enabled
   - System processes payment automatically
   - Money debited from saved payment method
   - Rent transferred to landlord escrow
   - Receipt generated
4. Option B: Manual payment
   - Tenant opens RentWallet.jsx
   - Clicks "Pay Rent"
   - Completes payment
   - Receipt generated
5. Payment recorded in RentWallet
6. Contract payment schedule updated
```

### **FLOW 4: Move-Out Process**
```
1. Tenant requests move-out → RentalContracts.jsx
2. System creates move-out checklist
3. Tenant uploads current condition → MoveInOut.jsx
4. System compares with move-in checklist
5. Damage assessment runs automatically
6. Estimated damages calculated
7. Landlord reviews and approves
8. Damages deducted from security deposit
9. Remaining deposit refunded
10. Contract marked as COMPLETED
11. Rating request sent to both parties
```

### **FLOW 5: Dispute Resolution**
```
1. Tenant/Landlord raises dispute → DisputeResolution.jsx
2. Fills dispute form (category, description)
3. Uploads evidence (images, videos, documents)
4. System creates dispute record
5. Admin notified
6. Admin reviews dispute → AdminRentalManagement.jsx
7. Admin communicates via dispute chat
8. Admin makes decision
9. Resolution applied (refund/penalty/warning)
10. Both parties notified
11. Dispute closed
```

### **FLOW 6: Property Verification**
```
1. Landlord requests verification → PropertyVerification.jsx
2. Pays verification fee
3. Uploads documents (ownership, identity, address)
4. Admin reviews documents → AdminRentalManagement.jsx
5. Admin verifies property details
6. Inspection scheduled (if needed)
7. Verification approved/rejected
8. Verified badge issued (if approved)
9. Badge displayed on listing
10. Annual renewal reminder sent
```

---

## 📁 **FILE STRUCTURE OVERVIEW**

```
web/src/
├── pages/
│   ├── RentProperty.jsx              [NEW]
│   ├── RentWallet.jsx                [NEW]
│   ├── RentalContracts.jsx           [NEW]
│   ├── MoveInOut.jsx                 [NEW]
│   ├── DisputeResolution.jsx         [NEW]
│   ├── PropertyVerification.jsx      [NEW]
│   ├── RentalRatings.jsx             [NEW]
│   ├── RentalLoans.jsx               [NEW]
│   ├── AdminRentalManagement.jsx     [NEW]
│   ├── CreateListing.jsx             [EXTEND]
│   ├── EditListing.jsx               [EXTEND]
│   ├── Listing.jsx                   [EXTEND]
│   ├── MyAppointments.jsx            [EXTEND]
│   └── PaymentDashboard.jsx          [EXTEND]
│
├── components/
│   ├── rental/                       [NEW DIRECTORY]
│   │   ├── RentLockPlanSelector.jsx
│   │   ├── ContractPreview.jsx
│   │   ├── DigitalSignature.jsx
│   │   ├── RentWalletOverview.jsx
│   │   ├── PaymentSchedule.jsx
│   │   ├── AutoDebitSettings.jsx
│   │   ├── RentPaymentHistory.jsx
│   │   ├── ContractList.jsx
│   │   ├── ContractDetailView.jsx
│   │   ├── ContractRenewalModal.jsx
│   │   ├── ChecklistForm.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── DamageAssessment.jsx
│   │   ├── DisputeList.jsx
│   │   ├── DisputeForm.jsx
│   │   ├── DisputeDetailView.jsx
│   │   ├── EvidenceUploader.jsx
│   │   ├── LocalityScoreDisplay.jsx
│   │   ├── RentPredictionDisplay.jsx
│   │   ├── RatingForm.jsx
│   │   └── RatingDisplay.jsx
│   │
│   ├── admin/                        [NEW DIRECTORY]
│   │   ├── RentalContractList.jsx
│   │   ├── DisputeManagement.jsx
│   │   ├── VerificationApproval.jsx
│   │   └── RentalAnalytics.jsx
│   │
│   ├── loans/                        [NEW DIRECTORY]
│   │   ├── LoanApplicationForm.jsx
│   │   ├── LoanEligibilityCheck.jsx
│   │   └── LoanStatusTracker.jsx
│   │
│   ├── verification/                 [NEW DIRECTORY]
│   │   ├── DocumentUploader.jsx
│   │   ├── VerificationStatus.jsx
│   │   └── VerificationBadge.jsx
│   │
│   ├── ListingItem.jsx              [EXTEND]
│   ├── Appointment.jsx              [EXTEND]
│   └── PaymentModal.jsx             [EXTEND]

api/
├── models/
│   ├── rentLockContract.model.js    [NEW]
│   ├── rentWallet.model.js          [NEW]
│   ├── moveInOutChecklist.model.js  [NEW]
│   ├── dispute.model.js             [NEW]
│   ├── propertyVerification.model.js [NEW]
│   ├── rentalRating.model.js        [NEW]
│   ├── rentPrediction.model.js      [NEW]
│   ├── rentalLoan.model.js          [NEW]
│   ├── listing.model.js             [EXTEND]
│   ├── booking.model.js             [EXTEND]
│   ├── payment.model.js             [EXTEND]
│   └── user.model.js                [EXTEND]
│
├── routes/
│   ├── rental.route.js              [NEW]
│   ├── loan.route.js                [NEW]
│   ├── payment.route.js             [EXTEND]
│   ├── booking.route.js             [EXTEND]
│   └── listing.route.js             [EXTEND]
│
├── controllers/
│   ├── rental.controller.js         [NEW]
│   ├── loan.controller.js           [NEW]
│   ├── rentPrediction.controller.js [NEW]
│   ├── localityScore.controller.js  [NEW]
│   ├── payment.controller.js        [EXTEND]
│   └── booking.controller.js        [EXTEND]
│
└── services/
    ├── rentPredictionService.js     [NEW]
    ├── localityScoreService.js      [NEW]
    ├── contractService.js           [NEW]
    ├── disputeResolutionService.js  [NEW]
    └── escrowService.js             [NEW]
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1: Core Foundation (Week 1-2)**
1. ✅ Database Models (all new models)
2. ✅ Extend existing models (Listing, Booking, Payment, User)
3. ✅ API Routes (rental.route.js basic endpoints)
4. ✅ Basic Rent-Lock Plan selection in CreateListing
5. ✅ RentProperty.jsx basic flow
6. ✅ Contract creation and storage

### **Phase 2: Payment & Wallet (Week 3-4)**
1. ✅ Rent Wallet system
2. ✅ Monthly payment processing
3. ✅ Auto-debit integration
4. ✅ Payment schedule tracking
5. ✅ RentWallet.jsx page
6. ✅ Escrow handling

### **Phase 3: Contract Management (Week 5-6)**
1. ✅ Digital signature system
2. ✅ Contract PDF generation
3. ✅ Contract renewal flow
4. ✅ RentalContracts.jsx page
5. ✅ Contract termination

### **Phase 4: Move-In/Out (Week 7-8)**
1. ✅ Move-in checklist system
2. ✅ Image/video upload
3. ✅ Damage assessment
4. ✅ MoveInOut.jsx page
5. ✅ Security deposit handling

### **Phase 5: Disputes & Verification (Week 9-10)**
1. ✅ Dispute submission system
2. ✅ Evidence upload
3. ✅ Admin dispute management
4. ✅ DisputeResolution.jsx page
5. ✅ Property verification system
6. ✅ PropertyVerification.jsx page

### **Phase 6: AI & Analytics (Week 11-12)**
1. ✅ Rent prediction AI integration
2. ✅ Locality score calculation
3. ✅ RentPredictionDisplay component
4. ✅ LocalityScoreDisplay component
5. ✅ Analytics dashboard

### **Phase 7: Ratings & Loans (Week 13-14)**
1. ✅ Rental rating system
2. ✅ RentalRatings.jsx page
3. ✅ Loan integration (if partner available)
4. ✅ RentalLoans.jsx page

### **Phase 8: Admin & Polish (Week 15-16)**
1. ✅ AdminRentalManagement.jsx
2. ✅ Analytics and reporting
3. ✅ Notifications system
4. ✅ Testing and bug fixes
5. ✅ Documentation

---

## 🔐 **SECURITY CONSIDERATIONS**

1. **Contract Signing:** Use cryptographic signatures, store IP, timestamp, user agent
2. **Payment Security:** Encrypt payment tokens, use secure payment gateways
3. **Document Security:** Secure document storage, access control
4. **Dispute Evidence:** Tamper-proof evidence storage
5. **Escrow:** Secure escrow account, automated settlement
6. **Auto-debit:** PCI-compliant token storage, consent management

---

## 📱 **NOTIFICATION REQUIREMENTS**

1. **Email Notifications:**
   - Rent due reminders (3 days, 1 day before)
   - Payment success/failure
   - Contract signed by other party
   - Move-in/move-out approvals
   - Dispute updates
   - Verification status

2. **In-App Notifications:**
   - Real-time rent wallet updates
   - Contract status changes
   - Dispute messages
   - Payment confirmations

3. **Push Notifications:**
   - Rent due alerts
   - Payment processed
   - Contract expiry warnings (30 days before)

---

## 📊 **ANALYTICS & REPORTING**

### **For Tenants:**
- Total rent paid
- Payment history
- Contract duration
- Ratings received

### **For Landlords:**
- Total rent received
- Active rentals
- Vacancy rate
- Ratings received

### **For Admin:**
- Total contracts
- Monthly revenue
- Dispute resolution time
- Verification approvals
- Payment success rate
- Auto-debit adoption rate

---

## 🎯 **SUCCESS METRICS**

1. **Adoption:** % of rental listings using Rent-Lock
2. **Retention:** Contract renewal rate
3. **Payment:** Auto-debit adoption rate
4. **Disputes:** Resolution time, satisfaction rate
5. **Verification:** Verification badge adoption
6. **Trust:** Average ratings (tenant/landlord)

---

## 📝 **NEXT STEPS**

1. Review this blueprint
2. Prioritize features based on business needs
3. Start with Phase 1 implementation
4. Set up database models
5. Create API routes
6. Build frontend pages incrementally
7. Test each phase before moving to next
8. Iterate based on user feedback

---

**This blueprint provides a complete roadmap for implementing the UrbanSetu Rental Platform. Each phase builds upon the previous one, ensuring a solid foundation before adding advanced features.**

