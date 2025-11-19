import RentLockContract from "../models/rentLockContract.model.js";
import RentWallet from "../models/rentWallet.model.js";
import Booking from "../models/booking.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

// Payment reminder function (can be called by cron job)
export const sendPaymentReminders = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Find all active contracts with upcoming payments
    const activeContracts = await RentLockContract.find({ status: 'active' })
      .populate('tenantId', 'email username')
      .populate('landlordId', 'email username')
      .populate('listingId', 'name');

    const reminders = [];

    for (const contract of activeContracts) {
      const wallet = await RentWallet.findOne({ contractId: contract._id, userId: contract.tenantId._id });
      
      if (!wallet || !wallet.paymentSchedule) continue;

      // Find upcoming payments (3 days and 1 day before due date)
      const upcomingPayments = wallet.paymentSchedule.filter(payment => {
        if (payment.status === 'completed') return false;
        
        const dueDate = new Date(payment.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return (daysUntilDue === 3 || daysUntilDue === 1) && dueDate >= now;
      });

      for (const payment of upcomingPayments) {
        const dueDate = new Date(payment.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send 3-day reminder
        if (daysUntilDue === 3 && !payment.reminderSent3Days) {
          reminders.push({
            contract,
            wallet,
            payment,
            daysUntilDue: 3,
            tenantEmail: contract.tenantId.email,
            propertyName: contract.listingId.name,
            amount: payment.amount
          });
          payment.reminderSent3Days = true;
        }

        // Send 1-day reminder
        if (daysUntilDue === 1 && !payment.reminderSent1Day) {
          reminders.push({
            contract,
            wallet,
            payment,
            daysUntilDue: 1,
            tenantEmail: contract.tenantId.email,
            propertyName: contract.listingId.name,
            amount: payment.amount
          });
          payment.reminderSent1Day = true;
        }
      }

      // Save wallet if reminders were sent
      if (upcomingPayments.some(p => p.reminderSent3Days || p.reminderSent1Day)) {
        await wallet.save();
      }
    }

    // TODO: Implement email sending for reminders
    // For now, just log the reminders
    console.log(`Payment reminders prepared: ${reminders.length}`);

    return {
      success: true,
      remindersSent: reminders.length,
      reminders
    };
  } catch (error) {
    console.error("Error sending payment reminders:", error);
    throw error;
  }
};

// Create Rent-Lock Contract
export const createContract = async (req, res, next) => {
  try {
    const {
      bookingId,
      rentLockPlan,
      lockDuration,
      lockedRentAmount,
      startDate,
      endDate,
      paymentFrequency,
      dueDate,
      securityDeposit,
      maintenanceCharges,
      advanceRent,
      lateFeePercentage,
      moveInDate
    } = req.body;

    const userId = req.user.id;

    // Validate booking
    const booking = await Booking.findById(bookingId)
      .populate('listingId')
      .populate('buyerId')
      .populate('sellerId');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Verify user is the tenant
    if (booking.buyerId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized. Only the tenant can create the contract." });
    }

    // Check if contract already exists for this booking
    const existingContract = await RentLockContract.findOne({ bookingId });
    if (existingContract) {
      return res.status(400).json({ message: "Contract already exists for this booking." });
    }

    // Calculate end date if not provided
    let calculatedEndDate = endDate;
    if (!endDate && startDate && lockDuration) {
      calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + lockDuration);
    }

    // Create contract
    const contract = await RentLockContract.create({
      bookingId,
      listingId: booking.listingId._id,
      tenantId: booking.buyerId._id,
      landlordId: booking.sellerId._id,
      rentLockPlan,
      lockDuration,
      lockedRentAmount,
      startDate: new Date(startDate),
      endDate: calculatedEndDate ? new Date(calculatedEndDate) : null,
      paymentFrequency: paymentFrequency || 'monthly',
      dueDate: dueDate || 1,
      securityDeposit,
      maintenanceCharges: maintenanceCharges || 0,
      advanceRent: advanceRent || 0,
      lateFeePercentage: lateFeePercentage || 5,
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      status: 'pending_signature'
    });

    // Update booking with contract reference
    booking.contractId = contract._id;
    booking.rentalStatus = 'pending_contract';
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Contract created successfully.",
      contract
    });
  } catch (error) {
    next(error);
  }
};

// Get Contract by ID
export const getContract = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    const contract = await RentLockContract.findById(contractId)
      .populate('listingId', 'name propertyNumber address city state')
      .populate('tenantId', 'username email avatar')
      .populate('landlordId', 'username email avatar')
      .populate('bookingId');

    if (!contract) {
      return res.status(404).json({ message: "Contract not found." });
    }

    // Verify user has access (tenant or landlord)
    if (contract.tenantId._id.toString() !== userId && contract.landlordId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    res.json({
      success: true,
      contract
    });
  } catch (error) {
    next(error);
  }
};

// List Contracts (for current user)
export const listContracts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, role } = req.query; // role: 'tenant' or 'landlord'

    let query = {};
    
    if (role === 'tenant') {
      query.tenantId = userId;
    } else if (role === 'landlord') {
      query.landlordId = userId;
    } else {
      // Get contracts where user is either tenant or landlord
      query.$or = [
        { tenantId: userId },
        { landlordId: userId }
      ];
    }

    if (status) {
      query.status = status;
    }

    const contracts = await RentLockContract.find(query)
      .populate('listingId', 'name propertyNumber address city state imageUrls')
      .populate('tenantId', 'username email avatar')
      .populate('landlordId', 'username email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    next(error);
  }
};

// Sign Contract (Tenant or Landlord)
export const signContract = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { signatureData } = req.body;
    const userId = req.user.id;

    const contract = await RentLockContract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found." });
    }

    // Determine if user is tenant or landlord
    const isTenant = contract.tenantId.toString() === userId;
    const isLandlord = contract.landlordId.toString() === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Unauthorized. Only tenant or landlord can sign." });
    }

    // Get client IP and user agent
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Sign contract
    if (isTenant) {
      if (contract.tenantSignature.signed) {
        return res.status(400).json({ message: "Contract already signed by tenant." });
      }
      contract.tenantSignature = {
        signed: true,
        signedAt: new Date(),
        ipAddress: clientIp,
        userAgent,
        signatureData: signatureData || ''
      };
    } else {
      if (contract.landlordSignature.signed) {
        return res.status(400).json({ message: "Contract already signed by landlord." });
      }
      contract.landlordSignature = {
        signed: true,
        signedAt: new Date(),
        ipAddress: clientIp,
        userAgent,
        signatureData: signatureData || ''
      };
    }

    // Update status if both parties signed
    if (contract.tenantSignature.signed && contract.landlordSignature.signed) {
      contract.status = 'active';
      
      // Update booking status
      const booking = await Booking.findById(contract.bookingId);
      if (booking) {
        booking.rentalStatus = 'contract_signed';
        await booking.save();
      }

      // Create rent wallet
      const wallet = await RentWallet.create({
        userId: contract.tenantId,
        contractId: contract._id
      });

      // Generate payment schedule
      wallet.generatePaymentSchedule(contract);
      await wallet.save();

      // Update booking with wallet ID
      if (booking) {
        booking.walletId = wallet._id;
        await booking.save();
      }

      // Update user rental profiles
      await User.findByIdAndUpdate(contract.tenantId, {
        $set: { 'rentalProfile.isTenant': true },
        $inc: { 'rentalProfile.activeContractsAsTenant': 1 }
      });

      await User.findByIdAndUpdate(contract.landlordId, {
        $set: { 'rentalProfile.isLandlord': true },
        $inc: { 'rentalProfile.activeContractsAsLandlord': 1 }
      });
    }

    await contract.save();

    res.json({
      success: true,
      message: isTenant ? "Tenant signature added." : "Landlord signature added.",
      contract,
      isFullySigned: contract.tenantSignature.signed && contract.landlordSignature.signed
    });
  } catch (error) {
    next(error);
  }
};

// Get Rent Wallet
export const getWallet = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    // Verify contract exists and user has access
    const contract = await RentLockContract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found." });
    }

    if (contract.tenantId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized. Only tenant can access wallet." });
    }

    const wallet = await RentWallet.findOne({ contractId: contract._id, userId })
      .populate('paymentSchedule.paymentId');

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    next(error);
  }
};

// Update Auto-debit Settings
export const updateAutoDebit = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { enabled, method, day, paymentMethodToken } = req.body;
    const userId = req.user.id;

    // Verify contract and user access
    const contract = await RentLockContract.findById(contractId);
    if (!contract || contract.tenantId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const wallet = await RentWallet.findOne({ contractId: contract._id, userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    // Update auto-debit settings
    wallet.autoDebitEnabled = enabled !== undefined ? enabled : wallet.autoDebitEnabled;
    wallet.autoDebitMethod = method || wallet.autoDebitMethod;
    wallet.autoDebitDay = day || wallet.autoDebitDay;
    wallet.paymentMethodToken = paymentMethodToken || wallet.paymentMethodToken;

    await wallet.save();

    // Update user default settings if needed
    if (enabled && method) {
      await User.findByIdAndUpdate(userId, {
        'autoDebitSettings.enabled': enabled,
        'autoDebitSettings.defaultMethod': method,
        'autoDebitSettings.defaultDay': day || 1
      });
    }

    res.json({
      success: true,
      message: "Auto-debit settings updated.",
      wallet
    });
  } catch (error) {
    next(error);
  }
};

