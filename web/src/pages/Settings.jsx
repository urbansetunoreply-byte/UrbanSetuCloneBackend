import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaKey, FaTrash, FaSignOutAlt, FaUser, FaTools, FaCloudUploadAlt, FaClipboardList, FaMobileAlt, FaCrown, FaTimes, FaCheck } from "react-icons/fa";
import { authenticatedFetch } from '../utils/auth';
import {
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signoutUserStart,
  signoutUserSuccess,
  signoutUserFailure,
} from "../redux/user/userSlice";
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSignout } from '../hooks/useSignout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Animation CSS classes
const animationClasses = {
  fadeInUp: "animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0 translate-y-8",
  slideInUp: "animate-[slideInUp_0.5s_ease-out_forwards] opacity-0 translate-y-4",
  scaleIn: "animate-[scaleIn_0.5s_ease-out_forwards] opacity-0 scale-95",
};

export default function Settings() {
  usePageTitle("Settings - Account Management");

  const { currentUser } = useSelector((state) => state.user);
  const { signout } = useSignout();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Account deletion states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtpError, setDeleteOtpError] = useState("");
  const [deleteOtpAttempts, setDeleteOtpAttempts] = useState(0);
  const [deleteResendTimer, setDeleteResendTimer] = useState(0);
  const [deleteCanResend, setDeleteCanResend] = useState(true);
  const [deleteReasonOpen, setDeleteReasonOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteOtherReason, setDeleteOtherReason] = useState("");
  const [deleteVerifying, setDeleteVerifying] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [deleteResending, setDeleteResending] = useState(false);
  const [deletePasswordVerified, setDeletePasswordVerified] = useState(false);
  const deleteOtpRef = useRef(null);

  // Transfer and delete states (for default admin)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showTransferPasswordModal, setShowTransferPasswordModal] = useState(false);
  const [transferDeletePassword, setTransferDeletePassword] = useState("");
  const [transferDeleteError, setTransferDeleteError] = useState("");
  const [transferDeletePasswordVerified, setTransferDeletePasswordVerified] = useState(false);
  const [transferDeleteResending, setTransferDeleteResending] = useState(false);
  const [transferDeleteDeleting, setTransferDeleteDeleting] = useState(false);
  const [transferOtp, setTransferOtp] = useState("");
  const [transferOtpSent, setTransferOtpSent] = useState(false);
  const [transferOtpError, setTransferOtpError] = useState("");
  const [transferResendTimer, setTransferResendTimer] = useState(0);
  const [transferCanResend, setTransferCanResend] = useState(true);
  const transferDeleteOtpRef = useRef(null);

  // Transfer rights states (for default admin)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAdmins, setTransferAdmins] = useState([]);
  const [selectedTransferAdmin, setSelectedTransferAdmin] = useState("");
  const [transferPassword, setTransferPassword] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferOtpVisible, setTransferOtpVisible] = useState(false);
  const [transferResending, setTransferResending] = useState(false);
  const [transferTransferring, setTransferTransferring] = useState(false);
  const [transferPasswordVerified, setTransferPasswordVerified] = useState(false);
  const [transferOtpAttempts, setTransferOtpAttempts] = useState(0);
  const transferRightsOtpRef = useRef(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    const shouldLock = showPasswordModal || showTransferPasswordModal || showTransferModal || showAdminModal;
    if (shouldLock) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showPasswordModal, showTransferPasswordModal, showTransferModal, showAdminModal]);

  // OTP resend timers
  useEffect(() => {
    let t1; if (deleteResendTimer > 0) t1 = setTimeout(() => setDeleteResendTimer(x => x - 1), 1000);
    return () => { if (t1) clearTimeout(t1); };
  }, [deleteResendTimer]);
  useEffect(() => {
    let t2; if (transferResendTimer > 0) t2 = setTimeout(() => setTransferResendTimer(x => x - 1), 1000);
    return () => { if (t2) clearTimeout(t2); };
  }, [transferResendTimer]);
  useEffect(() => {
    if (deleteResendTimer <= 0) setDeleteCanResend(true);
  }, [deleteResendTimer]);
  useEffect(() => {
    if (transferResendTimer <= 0) setTransferCanResend(true);
  }, [transferResendTimer]);

  // Auto-focus OTP input fields
  useEffect(() => {
    if (deleteOtpSent && deleteOtpRef.current) {
      deleteOtpRef.current.focus();
    }
  }, [deleteOtpSent]);
  useEffect(() => {
    if (transferOtpSent && transferDeleteOtpRef.current) {
      transferDeleteOtpRef.current.focus();
    }
  }, [transferOtpSent]);
  useEffect(() => {
    if (transferOtpSent && transferRightsOtpRef.current) {
      transferRightsOtpRef.current.focus();
    }
  }, [transferOtpSent]);

  // Load admins when modal opens
  useEffect(() => {
    if (showAdminModal) {
      fetchAdmins();
    }
  }, [showAdminModal]);

  // Fetch admins for transfer
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch(`${API_BASE_URL}/api/user/approved-admins/${currentUser._id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (res.ok) {
        setAdmins(data);
      } else {
        toast.error(data.message || 'Failed to fetch admins');
      }
    } catch (error) {
      toast.error('Error fetching admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchTransferAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/management/admins`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setTransferAdmins(data.filter(a => a.role === 'admin' || a.role === 'rootadmin'));
      } else {
        setTransferAdmins([]);
      }
    } catch (e) {
      setTransferAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const onHandleDelete = async () => {
    if (currentUser.isDefaultAdmin) {
      setSelectedAdmin("");
      setShowAdminModal(true);
      return;
    }
    setShowPasswordModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    if (!deletePassword) { setDeleteError('Password is required'); return; }
    setDeleteVerifying(true);
    const res = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-password`, { method:'POST', body: JSON.stringify({ password: deletePassword }) });
    if (!res.ok) {
      setShowPasswordModal(false);
      toast.error("For security reasons, you've been signed out automatically.");
      dispatch(signoutUserStart());
      const signoutRes = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials:'include' });
      const signoutData = await signoutRes.json();
      if (signoutData.success === false) dispatch(signoutUserFailure(signoutData.message)); else dispatch(signoutUserSuccess(signoutData));
      navigate('/sign-in', { replace: true });
      setDeleteVerifying(false);
      return;
    }
    setDeletePasswordVerified(true);
    setDeleteReasonOpen(true);
    setDeleteVerifying(false);
  };

  const handleContinueAfterReason = async () => {
    setDeleteOtpError("");
    setDeleteOtp("");
    setDeleteOtpSent(false);
    try {
      setDeleteProcessing(true);
      const sendRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-account-deletion-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email }) });
      const sendData = await sendRes.json();
      if (!sendRes.ok || sendData.success === false) {
        setDeleteError(sendData.message || 'Failed to send OTP');
        return;
      }
      setDeleteOtpSent(true);
      setDeleteCanResend(false);
      setDeleteResendTimer(30);
    } finally {
      setDeleteProcessing(false);
    }
  };

  const resendDeleteOtp = async () => {
    try {
      setDeleteResending(true);
      const res = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-account-deletion-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email }) });
      const data = await res.json();
      return res.ok && data.success !== false;
    } catch (_) { return false; }
    finally {
      setDeleteResending(false);
    }
  };

  const handleFinalDeleteWithOtp = async () => {
    setDeleteOtpError("");
    if (!deleteOtp || deleteOtp.length !== 6) { setDeleteOtpError('Enter 6-digit OTP'); return; }
    try {
      setDeleteDeleting(true);
      const vRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email, otp: deleteOtp }) });
      const vData = await vRes.json();
      if (!vRes.ok || vData.success === false || vData.type !== 'account_deletion') {
        const att = deleteOtpAttempts + 1; setDeleteOtpAttempts(att);
        setDeleteOtpError(vData.message || 'Invalid OTP');
        if (att >= 5) {
          setShowPasswordModal(false);
          toast.error("For security reasons, you've been signed out automatically.");
          dispatch(signoutUserStart());
          const signoutRes = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials:'include' });
          const signoutData = await signoutRes.json();
          if (signoutData.success === false) dispatch(signoutUserFailure(signoutData.message)); else dispatch(signoutUserSuccess(signoutData));
          navigate('/sign-in', { replace: true });
          return;
        }
        setDeleteDeleting(false);
        return;
      }
      const apiUrl = `${API_BASE_URL}/api/user/delete/${currentUser._id}`;
      const payload = { password: deletePassword, reason: deleteReason === 'other' ? 'other' : deleteReason, otherReason: deleteReason === 'other' ? deleteOtherReason : undefined };
      const options = { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' };
      const res = await authenticatedFetch(apiUrl, options);
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.message || 'Account deletion failed'); setDeleteDeleting(false); return; }
      dispatch(deleteUserSuccess(data));
      setShowPasswordModal(false);
      toast.success("Account deleted successfully. Thank you for being with us — we hope to serve you again in the future!");
      navigate('/');
    } catch (_) {
      setDeleteOtpError('Verification failed');
    } finally {
      setDeleteDeleting(false);
    }
  };

  const handleTransferAndDelete = async () => {
    if (!selectedAdmin) {
      toast.error('Please select an admin to transfer default admin rights to');
      return;
    }
    setShowTransferPasswordModal(true);
    setTransferDeletePassword("");
    setTransferDeleteError("");
    setTransferOtpSent(false);
    setTransferOtp("");
    setTransferOtpError("");
    setTransferDeletePasswordVerified(false);
    setTransferLoading(false);
    setTransferDeleteResending(false);
    setTransferDeleteDeleting(false);
    setTransferCanResend(true);
    setTransferResendTimer(0);
  };

  const handleConfirmTransferAndDelete = async () => {
    setTransferDeleteError("");
    if (!transferDeletePassword) {
      setTransferDeleteError("Password is required");
      return;
    }
    try {
      setTransferLoading(true);
      const verifyRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-password`, {
        method: 'POST',
        body: JSON.stringify({ password: transferDeletePassword })
      });
      if (!verifyRes.ok) {
        setShowTransferPasswordModal(false);
        toast.error("For security reasons, you've been signed out automatically.");
        await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
        navigate('/sign-in', { replace: true });
        return;
      }
      const sendRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-transfer-rights-otp`, {
        method: 'POST',
        body: JSON.stringify({ email: currentUser.email })
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok || sendData.success === false) {
        setTransferDeleteError(sendData.message || 'Failed to send OTP');
        return;
      }
      setTransferDeletePasswordVerified(true);
      setTransferOtp("");
      setTransferOtpSent(true);
      setTransferCanResend(false);
      setTransferResendTimer(30);
    } catch (error) {
      setTransferDeleteError('Failed to verify password');
    } finally {
      setTransferLoading(false);
    }
  };

  const resendTransferOtp = async () => {
    try {
      setTransferResending(true);
      setTransferDeleteResending(true);
      const res = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-transfer-rights-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email }) });
      const data = await res.json();
      return res.ok && data.success !== false;
    } catch (_) { return false; }
    finally {
      setTransferResending(false);
      setTransferDeleteResending(false);
    }
  };

  const handleFinalTransferDeleteWithOtp = async () => {
    setTransferOtpError("");
    if (!transferOtp || transferOtp.length !== 6) { setTransferOtpError('Enter 6-digit OTP'); return; }
    try {
      setTransferDeleteDeleting(true);
      const vRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email, otp: transferOtp }) });
      const vData = await vRes.json();
      if (!vRes.ok || vData.success === false || vData.type !== 'forgotPassword') {
        const att = transferOtpAttempts + 1; setTransferOtpAttempts(att);
        setTransferOtpError(vData.message || 'Invalid OTP');
        if (att >= 5) {
          setShowTransferPasswordModal(false);
          toast.error("For security reasons, you've been signed out automatically.");
          await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials:'include' });
          navigate('/sign-in', { replace: true });
        }
        setTransferDeleteDeleting(false);
        return;
      }
      const transferRes = await fetch(`${API_BASE_URL}/api/user/transfer-default-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentAdminId: currentUser._id, newDefaultAdminId: selectedAdmin })
      });
      const transferData = await transferRes.json();
      if (!transferRes.ok) { setTransferOtpError(transferData.message || 'Failed to transfer default admin rights'); return; }
      const deleteRes = await fetch(`${API_BASE_URL}/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: transferDeletePassword })
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) { setTransferOtpError(deleteData.message || 'Failed to delete account after transfer'); return; }
      dispatch(deleteUserSuccess(deleteData));
      setShowAdminModal(false);
      setShowTransferPasswordModal(false);
      toast.success('Admin rights transferred and account deleted successfully!');
      navigate('/');
    } catch (_) {
      setTransferOtpError('Verification failed');
    } finally {
      setTransferDeleteDeleting(false);
    }
  };

  const onHandleSignout = async (e) => {
    e.preventDefault();
    await signout({
      showToast: true,
      navigateTo: "/",
      delay: 0
    });
  };

  const onShowTransferModal = () => {
    setShowTransferModal(true);
    setTransferError("");
    setTransferPassword("");
    setSelectedTransferAdmin("");
    setTransferOtpSent(false);
    setTransferOtp("");
    setTransferOtpError("");
    setTransferPasswordVerified(false);
    setTransferSubmitting(false);
    setTransferResending(false);
    setTransferTransferring(false);
    setTransferCanResend(true);
    setTransferResendTimer(0);
    fetchTransferAdmins();
  };

  const handleTransferSubmit = async () => {
    setTransferError("");
    if (!selectedTransferAdmin) {
      setTransferError("Please select an admin to transfer rights to.");
      return;
    }
    if (!transferPassword) {
      setTransferError("Password is required.");
      return;
    }
    setTransferSubmitting(true);
    try {
      const verifyRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-password`, {
        method: 'POST',
        body: JSON.stringify({ password: transferPassword })
      });
      if (!verifyRes.ok) {
        setShowTransferModal(false);
        toast.error("For security reasons, you've been signed out automatically.");
        await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
        navigate('/sign-in', { replace: true });
        return;
      }
      const sendRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-transfer-rights-otp`, {
        method: 'POST',
        body: JSON.stringify({ email: currentUser.email })
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok || sendData.success === false) {
        setTransferError(sendData.message || 'Failed to send OTP');
        return;
      }
      setTransferPasswordVerified(true);
      setTransferOtp("");
      setTransferOtpSent(true);
      setTransferOtpVisible(true);
      setTransferCanResend(false);
      setTransferResendTimer(30);
    } catch (e) {
      setTransferError('Failed to verify password');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleFinalTransferWithOtp = async () => {
    setTransferError("");
    if (!transferOtp || transferOtp.length !== 6) {
      setTransferError('Enter 6-digit OTP');
      return;
    }
    try {
      setTransferTransferring(true);
      const vRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/verify-otp`, { method:'POST', body: JSON.stringify({ email: currentUser.email, otp: transferOtp }) });
      const vData = await vRes.json();
      if (!vRes.ok || vData.success === false || vData.type !== 'forgotPassword') {
        const att = transferOtpAttempts + 1; setTransferOtpAttempts(att);
        setTransferError(vData.message || 'Invalid OTP');
        if (att >= 5) {
          setShowTransferModal(false);
          toast.error("For security reasons, you've been signed out automatically.");
          await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials:'include' });
          navigate('/sign-in', { replace: true });
        }
        setTransferTransferring(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/admin/transfer-rights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetAdminId: selectedTransferAdmin, password: transferPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setTransferError(data.message || 'Failed to transfer rights.');
        return;
      }
      toast.success(data.message || 'Admin rights transferred successfully!');
      setShowTransferModal(false);
      navigate('/sign-in', { replace: true });
    } catch (e) {
      setTransferError('Failed to transfer rights.');
    } finally {
      setTransferTransferring(false);
    }
  };

  if (!currentUser) {
    return <div className="text-center text-red-600 mt-10">Please sign in to access settings.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-xl shadow-lg p-8 ${animationClasses.fadeInUp}`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Account Settings
            </span>
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate((currentUser.role === 'admin' || currentUser.role === 'rootadmin') ? '/admin/change-password' : '/user/change-password')}
              className={`w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
            >
              <FaKey className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-wiggle`} />
              Change Password
            </button>
            
            <button
              onClick={() => navigate((currentUser.role === 'admin' || currentUser.role === 'rootadmin') ? '/admin/device-management' : '/user/device-management')}
              className={`w-full bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
            >
              <FaMobileAlt className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-pulse`} />
              Device Management
            </button>

            {(currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
              <button
                onClick={() => navigate('/admin/management')}
                className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaUser className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-pulse`} />
                Accounts
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
              <button
                onClick={() => navigate('/admin/session-management')}
                className={`w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaTools className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-pulse`} />
                Session Management
              </button>
            )}

            {currentUser.role === 'rootadmin' && (
              <button
                onClick={() => navigate('/admin/deployment-management')}
                className={`w-full bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaCloudUploadAlt className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-pulse`} />
                Deployment Management
              </button>
            )}

            {(currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
              <button
                onClick={() => navigate('/admin/session-audit-logs')}
                className={`w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaClipboardList className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-pulse`} />
                Audit Logs
              </button>
            )}
              
            {currentUser.isDefaultAdmin && (
              <button
                onClick={onShowTransferModal}
                className={`w-full bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaCrown className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-bounce text-yellow-200`} />
                Transfer Rights
              </button>
            )}
            
            {currentUser.isDefaultAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> You must transfer your default admin rights to another admin before you can delete your account.
                    </p>
                  </div>
                </div>
              </div>
            )}
              
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onHandleSignout}
                className={`bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaSignOutAlt className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1`} />
                Sign Out
              </button>
              
              <button
                onClick={onHandleDelete}
                className={`bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center font-semibold group ${animationClasses.slideInUp}`}
              >
                <FaTrash className={`w-4 h-4 mr-2 transition-transform duration-300 group-hover:animate-wiggle`} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Selection Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className={`bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto ${animationClasses.scaleIn}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Transfer Default Admin Rights</h3>
                <button
                  onClick={() => {
                    setSelectedAdmin("");
                    setShowAdminModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  As the default admin, you must select another approved admin to transfer your default admin rights before deleting your account.
                </p>
                
                {loadingAdmins ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No other approved admins found.</p>
                    <p className="text-sm text-gray-400 mt-2">You cannot delete your account until another admin is approved.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Admin to Transfer Rights To:
                    </label>
                    <select
                      value={selectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose an admin...</option>
                      {admins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.username} ({admin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedAdmin("");
                    setShowAdminModal(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferAndDelete}
                  disabled={!selectedAdmin || transferLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {transferLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4 mr-2" />
                      Transfer & Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className={`bg-white rounded-xl shadow-xl max-w-md w-full ${animationClasses.scaleIn}`}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Account Deletion</h3>
              <p className="mb-4 text-gray-600">Enter your password. After verification, we will email you an OTP to complete deletion.</p>
              <form onSubmit={async e => { e.preventDefault(); if (!deleteOtpSent && !deleteReasonOpen) { await handleConfirmDelete(); } else if (!deleteOtpSent && deleteReasonOpen) { await handleContinueAfterReason(); } else { await handleFinalDeleteWithOtp(); } }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
                <input
                  type="password"
                  className={`w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${deletePasswordVerified || deleteVerifying ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  disabled={deletePasswordVerified || deleteVerifying}
                />
                {deleteError && <div className="text-red-600 text-sm mb-2">{deleteError}</div>}

                {deleteReasonOpen && !deleteOtpSent && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for leaving</label>
                    <select
                      className={`w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${deleteProcessing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      value={deleteReason}
                      onChange={e => setDeleteReason(e.target.value)}
                      disabled={deleteProcessing}
                    >
                      <option value="">Select a reason</option>
                      <option value="Better platform">Found a better platform</option>
                      <option value="Privacy or security concerns">Privacy or security concerns</option>
                      <option value="Too many notifications/emails">Too many notifications/emails</option>
                      <option value="Couldn't find suitable property">Couldn't find suitable property</option>
                      <option value="Just testing / trial account">Just testing / trial account</option>
                      <option value="other">Other (please specify)</option>
                    </select>
                    {deleteReason === 'other' && (
                      <input
                        type="text"
                        className={`w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${deleteProcessing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Please describe your reason (optional)"
                        value={deleteOtherReason}
                        onChange={e => setDeleteOtherReason(e.target.value)}
                        disabled={deleteProcessing}
                      />
                    )}
                  </div>
                )}

                {deleteOtpSent && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        ref={deleteOtpRef}
                        type="text"
                        maxLength="6"
                        value={deleteOtp}
                        onChange={e=> setDeleteOtp(e.target.value.replace(/[^0-9]/g,''))}
                        className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${deleteResending || deleteDeleting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="6-digit OTP"
                        disabled={deleteResending || deleteDeleting}
                      />
                      <button type="button" disabled={!deleteCanResend || deleteResendTimer>0 || deleteResending || deleteDeleting} onClick={async()=>{ if(deleteResendTimer>0) return; setDeleteOtpError(""); const ok = await resendDeleteOtp(); if(ok){ setDeleteCanResend(false); setDeleteResendTimer(30);} }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50 sm:self-auto self-start">{deleteResending ? 'Sending...' : (deleteResendTimer>0?`Resend in ${deleteResendTimer}s`:'Resend OTP')}</button>
                    </div>
                    {deleteOtpError && <div className="text-red-600 text-sm mt-1">{deleteOtpError}</div>}
                    <div className="text-green-600 text-sm mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      OTP has been sent to your email address
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { 
                      setShowPasswordModal(false); 
                      setDeletePassword(""); 
                      setDeleteError(""); 
                      setDeleteReasonOpen(false); 
                      setDeleteReason(""); 
                      setDeleteOtherReason(""); 
                      setDeleteOtpSent(false);
                      setDeleteOtp("");
                      setDeleteOtpError("");
                      setDeletePasswordVerified(false);
                      setDeleteVerifying(false);
                      setDeleteProcessing(false);
                      setDeleteDeleting(false);
                      setDeleteResending(false);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleteVerifying || deleteProcessing || deleteDeleting || deleteResending}
                  >{deleteOtpSent ? (deleteDeleting ? 'Deleting...' : 'Delete') : (deleteReasonOpen ? (deleteProcessing ? 'Processing...' : 'Continue') : (deleteVerifying ? 'Verifying...' : 'Verify'))}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transfer and Delete Modal */}
      {showTransferPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className={`bg-white rounded-xl shadow-xl max-w-md w-full ${animationClasses.scaleIn}`}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Account Deletion</h3>
              <p className="mb-4 text-gray-600">Please enter your password to confirm account deletion after transferring default admin rights. This action cannot be undone.</p>
              <form onSubmit={async e => { e.preventDefault(); if (!transferOtpSent) { await handleConfirmTransferAndDelete(); } else { await handleFinalTransferDeleteWithOtp(); } }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
                <input
                  type="password"
                  className={`w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${transferDeletePasswordVerified || transferLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your password"
                  value={transferDeletePassword}
                  onChange={e => setTransferDeletePassword(e.target.value)}
                  disabled={transferDeletePasswordVerified || transferLoading}
                />
                {transferDeleteError && <div className="text-red-600 text-sm mb-2">{transferDeleteError}</div>}
                {transferOtpSent && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <div className="flex gap-2">
                      <input ref={transferDeleteOtpRef} type="text" maxLength="6" value={transferOtp} onChange={e=> setTransferOtp(e.target.value.replace(/[^0-9]/g,''))} className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${transferDeleteResending || transferDeleteDeleting ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="6-digit OTP" disabled={transferDeleteResending || transferDeleteDeleting} />
                      <button type="button" disabled={!transferCanResend || transferResendTimer>0 || transferDeleteResending || transferDeleteDeleting} onClick={async()=>{ if(transferResendTimer>0) return; const ok = await resendTransferOtp(); if(ok){ setTransferCanResend(false); setTransferResendTimer(30);} }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50">{transferDeleteResending ? 'Sending...' : (transferResendTimer>0?`Resend in ${transferResendTimer}s`:'Resend OTP')}</button>
                    </div>
                    {transferOtpError && <div className="text-red-600 text-sm mt-1">{transferOtpError}</div>}
                    <div className="text-green-600 text-sm mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      OTP has been sent to your email address
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { 
                      setShowTransferPasswordModal(false); 
                      setTransferDeletePassword(""); 
                      setTransferDeleteError(""); 
                      setTransferOtpSent(false);
                      setTransferOtp("");
                      setTransferOtpError("");
                      setTransferDeletePasswordVerified(false);
                      setTransferLoading(false);
                      setTransferDeleteResending(false);
                      setTransferDeleteDeleting(false);
                      setTransferCanResend(true);
                      setTransferResendTimer(0);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={transferLoading || transferDeleteResending || transferDeleteDeleting}
                  >
                    {transferDeleteDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Deleting...
                      </>
                    ) : transferOtpSent ? 'Transfer & Delete' : (transferLoading ? 'Processing...' : 'Verify & Send OTP')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Rights Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className={`bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto ${animationClasses.scaleIn}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Transfer Root Admin Rights</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Select an admin to transfer your root admin rights. You will remain an admin after transfer.
                </p>
                {loadingAdmins ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : transferAdmins.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No other admins found.</p>
                    <p className="text-sm text-gray-400 mt-2">You cannot transfer rights until another admin exists.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Admin to Transfer Rights To:
                    </label>
                    <select
                      value={selectedTransferAdmin}
                      onChange={e => setSelectedTransferAdmin(e.target.value)}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${transferPasswordVerified || transferSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={transferPasswordVerified || transferSubmitting}
                    >
                      <option value="">Choose an admin...</option>
                      {transferAdmins.map(admin => (
                        <option key={admin._id} value={admin._id}>
                          {admin.username} ({admin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password:</label>
                <form onSubmit={e => { e.preventDefault(); transferOtpSent ? handleFinalTransferWithOtp() : handleTransferSubmit(); }}>
                  <input
                    type="password"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${transferPasswordVerified || transferSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter your password"
                    value={transferPassword}
                    onChange={e => setTransferPassword(e.target.value)}
                    disabled={transferPasswordVerified || transferSubmitting}
                  />
                  {!transferOtpSent && transferError && <div className="text-red-600 text-sm mt-2">{transferError}</div>}
                  {transferOtpSent && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                      <div className="flex gap-2">
                        <input ref={transferRightsOtpRef} type="text" maxLength="6" value={transferOtp} onChange={e=> setTransferOtp(e.target.value.replace(/[^0-9]/g,''))} className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${transferResending || transferTransferring ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="6-digit OTP" disabled={transferResending || transferTransferring} />
                        <button type="button" disabled={!transferCanResend || transferResendTimer>0 || transferResending || transferTransferring} onClick={async()=>{ if(transferResendTimer>0) return; const ok = await resendTransferOtp(); if(ok){ setTransferCanResend(false); setTransferResendTimer(30);} }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50">{transferResending ? 'Sending...' : (transferResendTimer>0?`Resend in ${transferResendTimer}s`:'Resend OTP')}</button>
                      </div>
                      {transferError && <div className="text-red-600 text-sm mt-2">{transferError}</div>}
                      <div className="text-green-600 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        OTP has been sent to your email address
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferModal(false);
                        setSelectedTransferAdmin("");
                        setTransferPassword("");
                        setTransferError("");
                        setTransferOtpSent(false);
                        setTransferOtp("");
                        setTransferOtpError("");
                        setTransferPasswordVerified(false);
                        setTransferSubmitting(false);
                        setTransferResending(false);
                        setTransferTransferring(false);
                        setTransferCanResend(true);
                        setTransferResendTimer(0);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >Cancel</button>
                    <button
                      type="submit"
                      disabled={!selectedTransferAdmin || !transferPassword || transferSubmitting || transferResending || transferTransferring || (transferOtpSent && transferOtp.length !== 6)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      {transferTransferring ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Transferring...
                        </>
                      ) : transferSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaCrown className="w-4 h-4 mr-2" />
                          {transferOtpSent ? 'Transfer Rights' : 'Verify'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

