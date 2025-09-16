import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import DeletedAccount from '../models/deletedAccount.model.js';
import AuditLog from '../models/auditLog.model.js';

// Fetch all users (for admin/rootadmin)
export const getManagementUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
      return next(errorHandler(403, 'Access denied'));
    }
    // Admins: only see users (not admins/rootadmin)
    // Rootadmin: see all users (not admins/rootadmin)
    const users = await User.find({ role: 'user' }).select('-password');
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// Fetch all admins (for admin and rootadmin)
export const getManagementAdmins = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
      return next(errorHandler(403, 'Access denied. Only admins can access admin management.'));
    }
    // Regular admins: only see other admins (not rootadmin/default admin)
    // Rootadmin: see all admins (not rootadmin/default admin)
    const query = { role: 'admin', _id: { $ne: currentUser._id } };
    if (currentUser.role === 'admin') {
      // Regular admins cannot see rootadmin or default admin
      query.isDefaultAdmin = { $ne: true };
    }
    const admins = await User.find(query).select('-password');
    res.status(200).json(admins);
  } catch (err) {
    next(err);
  }
};

// Suspend/activate user or admin
export const suspendUserOrAdmin = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return next(errorHandler(403, 'Access denied'));
    if (type === 'user') {
      // Only admin/rootadmin can suspend users
      if (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') {
        return next(errorHandler(403, 'Access denied'));
      }
      const user = await User.findById(id);
      if (!user || user.role !== 'user') return next(errorHandler(404, 'User not found'));
      const togglingToSuspended = user.status === 'active';
      user.status = togglingToSuspended ? 'suspended' : 'active';
      if (togglingToSuspended) {
        user.suspendedAt = new Date();
        user.suspendedBy = currentUser._id;
      } else {
        user.suspendedAt = null;
        user.suspendedBy = null;
      }
      await user.save();
      
      // Emit socket event for account suspension
      const io = req.app.get('io');
      if (io) {
        io.emit('account_suspended', {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          status: user.status,
          type: 'user'
        });
      }
      
      return res.status(200).json({ message: 'User status updated', status: user.status });
    } else if (type === 'admin') {
      // Only the current default admin can suspend admins
      if (!currentUser.isDefaultAdmin) {
        return next(errorHandler(403, 'Access denied. Only the current default admin can suspend admins.'));
      }
      const admin = await User.findById(id);
      if (!admin || admin.role !== 'admin') return next(errorHandler(404, 'Admin not found'));
      const togglingAdminToSuspended = admin.status === 'active';
      admin.status = togglingAdminToSuspended ? 'suspended' : 'active';
      if (togglingAdminToSuspended) {
        admin.suspendedAt = new Date();
        admin.suspendedBy = currentUser._id;
      } else {
        admin.suspendedAt = null;
        admin.suspendedBy = null;
      }
      await admin.save();
      
      // Emit socket event for account suspension
      const io = req.app.get('io');
      if (io) {
        io.emit('account_suspended', {
          userId: admin._id.toString(),
          username: admin.username,
          email: admin.email,
          status: admin.status,
          type: 'admin'
        });
      }
      
      return res.status(200).json({ message: 'Admin status updated', status: admin.status });
    } else {
      return next(errorHandler(400, 'Invalid type'));
    }
  } catch (err) {
    next(err);
  }
};

// Delete user or admin
export const deleteUserOrAdmin = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return next(errorHandler(403, 'Access denied'));
    const isRoot = currentUser.role === 'rootadmin' || currentUser.isDefaultAdmin;
    if (type === 'user') {
      if (currentUser.role !== 'admin' && !isRoot) {
        return next(errorHandler(403, 'Access denied'));
      }
      const user = await User.findById(id);
      if (!user || user.role !== 'user') return next(errorHandler(404, 'User not found'));
      await DeletedAccount.create({
        accountId: user._id,
        name: user.username,
        email: user.email,
        role: 'user',
        deletedAt: new Date(),
        deletedBy: currentUser._id,
        reason: req.body?.reason || ''
      });
      await User.findByIdAndDelete(id);
      return res.status(200).json({ message: 'User moved to DeletedAccounts' });
    } else if (type === 'admin') {
      if (!isRoot) {
        return next(errorHandler(403, 'Access denied'));
      }
      const admin = await User.findById(id);
      if (!admin || admin.role !== 'admin') return next(errorHandler(404, 'Admin not found'));
      await DeletedAccount.create({
        accountId: admin._id,
        name: admin.username,
        email: admin.email,
        role: 'admin',
        deletedAt: new Date(),
        deletedBy: currentUser._id,
        reason: req.body?.reason || ''
      });
      await User.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Admin moved to DeletedAccounts' });
    } else {
      return next(errorHandler(400, 'Invalid type'));
    }
  } catch (err) {
    next(err);
  }
};

// Deleted accounts APIs
export const getDeletedAccounts = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
      return next(errorHandler(403, 'Access denied'));
    }
    const isRoot = currentUser.role === 'rootadmin' || currentUser.isDefaultAdmin;
    const { role, q, from, to, deletedBy, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (!isRoot) filter.role = 'user';
    if (role && (role === 'user' || role === 'admin')) filter.role = role;
    if (q) filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') }
    ];
    if (from || to) {
      filter.deletedAt = {};
      if (from) filter.deletedAt.$gte = new Date(from);
      if (to) filter.deletedAt.$lte = new Date(to);
    }
    if (deletedBy) filter.deletedBy = deletedBy === 'self' ? 'self' : deletedBy;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      DeletedAccount.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(Number(limit)),
      DeletedAccount.countDocuments(filter)
    ]);
    res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const restoreDeletedAccount = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const isRoot = currentUser && (currentUser.role === 'rootadmin' || currentUser.isDefaultAdmin);
    if (!isRoot) return next(errorHandler(403, 'Access denied'));
    const { id } = req.params; // DeletedAccount id
    const record = await DeletedAccount.findById(id);
    if (!record) return next(errorHandler(404, 'Deleted account not found'));
    // Recreate user/admin
    const exists = await User.findOne({ email: record.email });
    if (exists) return next(errorHandler(400, 'An active account with this email already exists'));
    const restored = new User({
      username: record.name,
      email: record.email,
      password: (await import('bcryptjs')).default.hashSync(Math.random().toString(36).slice(-10), 10),
      role: record.role,
      adminApprovalStatus: record.role === 'admin' ? 'approved' : undefined,
      status: 'active'
    });
    await restored.save();
    await AuditLog.create({ action: 'restore', performedBy: currentUser._id, targetAccount: record._id, targetEmail: record.email });
    await DeletedAccount.findByIdAndDelete(id);
    res.json({ success: true, message: 'Account restored', userId: restored._id });
  } catch (err) {
    next(err);
  }
};

export const purgeDeletedAccount = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const isRoot = currentUser && (currentUser.role === 'rootadmin' || currentUser.isDefaultAdmin);
    if (!isRoot) return next(errorHandler(403, 'Access denied'));
    const { id } = req.params;
    const record = await DeletedAccount.findById(id);
    if (!record) return next(errorHandler(404, 'Deleted account not found'));
    await DeletedAccount.findByIdAndDelete(id);
    await AuditLog.create({ action: 'purge', performedBy: currentUser._id, targetAccount: record._id, targetEmail: record.email });
    res.json({ success: true, message: 'Deleted account purged' });
  } catch (err) {
    next(err);
  }
};

// Demote admin to user (default admin only)
export const demoteAdminToUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isDefaultAdmin) {
      return next(errorHandler(403, 'Access denied. Only the current default admin can demote admins.'));
    }
    const admin = await User.findById(id);
    if (!admin || admin.role !== 'admin') return next(errorHandler(404, 'Admin not found'));
    // Prevent demoting yourself
    if (admin._id.equals(currentUser._id)) {
      return next(errorHandler(400, 'You cannot demote yourself.'));
    }
    admin.role = 'user';
    admin.adminApprovalStatus = undefined;
    admin.adminApprovalDate = undefined;
    admin.approvedBy = undefined;
    admin.adminRequestDate = undefined;
    admin.isDefaultAdmin = false;
    await admin.save();
    return res.status(200).json({ message: 'Admin demoted to user successfully.' });
  } catch (err) {
    next(err);
  }
};

// Promote user to admin (default admin only)
export const promoteUserToAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isDefaultAdmin) {
      return next(errorHandler(403, 'Access denied. Only the current default admin can promote users.'));
    }
    const user = await User.findById(id);
    if (!user || user.role !== 'user') return next(errorHandler(404, 'User not found'));
    user.role = 'admin';
    user.adminApprovalStatus = 'approved';
    user.adminApprovalDate = new Date();
    user.approvedBy = currentUser._id;
    await user.save();
    return res.status(200).json({ message: 'User promoted to admin successfully.' });
  } catch (err) {
    next(err);
  }
}; 

// Re-approve a rejected admin (default admin only)
export const reapproveRejectedAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isDefaultAdmin) {
      return next(errorHandler(403, 'Access denied. Only the current default admin can re-approve admins.'));
    }
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') return next(errorHandler(404, 'Admin not found'));
    if (admin.adminApprovalStatus !== 'rejected') return next(errorHandler(400, 'Only rejected admins can be re-approved.'));
    admin.adminApprovalStatus = 'approved';
    admin.status = 'active';
    admin.adminApprovalDate = new Date();
    admin.approvedBy = currentUser._id;
    await admin.save();
    res.status(200).json(admin);
  } catch (err) {
    next(err);
  }
}; 