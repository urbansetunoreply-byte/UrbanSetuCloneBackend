import React, { useEffect, useState, useRef, useCallback } from "react";
import { FaTrash, FaSearch, FaPen, FaCheck, FaTimes, FaUserShield, FaUser, FaEnvelope, FaPhone, FaVideo, FaArchive, FaUndo, FaCommentDots, FaCheckDouble, FaBan, FaPaperPlane, FaCalendar, FaLightbulb, FaCopy, FaEllipsisV, FaFlag, FaCircle, FaInfoCircle, FaSync, FaStar, FaRegStar, FaThumbtack, FaCalendarAlt, FaCheckSquare, FaDownload, FaDollarSign, FaCreditCard, FaSpinner, FaExclamationTriangle, FaMoneyBill, FaHistory } from "react-icons/fa";
import { FormattedTextWithLinks, FormattedTextWithLinksAndSearch, FormattedTextWithReadMore } from '../utils/linkFormatter.jsx';
import UserAvatar from '../components/UserAvatar';
import { focusWithoutKeyboard, focusWithKeyboard } from '../utils/mobileUtils';
import ImagePreview from '../components/ImagePreview';
import LinkPreview from '../components/LinkPreview';
import { EmojiButton } from '../components/EmojiPicker';
import CustomEmojiPicker from '../components/EmojiPicker';
import { useSoundEffects, SoundControl } from '../components/SoundEffects';
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createPortal } from 'react-dom';
import Appointment from "../components/Appointment";
import { toast, ToastContainer } from 'react-toastify';
import { socket } from "../utils/socket";
import { exportEnhancedChatToPDF } from '../utils/pdfExport';
import ExportChatModal from '../components/ExportChatModal';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';
import { useCallContext } from '../contexts/CallContext';
import CallHistoryModal from '../components/CallHistoryModal';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const APPOINTMENT_TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  const label = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  return { value, label };
});

const formatTimeDisplay = (timeValue = '') => {
  if (!timeValue.includes(':')) return timeValue;
  const [hourStr, minuteStr] = timeValue.split(':');
  const hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return timeValue;
  const displayHour = ((hour + 11) % 12) + 1;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minuteStr.padStart(2, '0')} ${period}`;
};

export default function MyAppointments() {
  // Set page title
  usePageTitle("My Appointments - Bookings");

  const { currentUser } = useSelector((state) => state.user);

  // Function to handle phone number clicks
  const handlePhoneClick = (phoneNumber) => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile devices, open phone dialer
      window.location.href = `tel:${phoneNumber}`;
    } else {
      // For desktop, copy to clipboard
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast.success(`Phone number ${phoneNumber} copied to clipboard!`);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = phoneNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`Phone number ${phoneNumber} copied to clipboard!`);
      });
    }
  };
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [filteredArchivedAppointments, setFilteredArchivedAppointments] = useState([]);
  const [actionLoading, setActionLoading] = useState("");
  const [showOtherPartyModal, setShowOtherPartyModal] = useState(false);
  const [selectedOtherParty, setSelectedOtherParty] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showReinitiateModal, setShowReinitiateModal] = useState(false);
  const [reinitiateData, setReinitiateData] = useState(null);
  const [reinitiatePaymentStatus, setReinitiatePaymentStatus] = useState(null);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();
  const [swipedMsgId, setSwipedMsgId] = useState(null);

  // Archive modal states
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [appointmentToHandle, setAppointmentToHandle] = useState(null);

  // New state for notification-triggered chat opening
  const [notificationChatData, setNotificationChatData] = useState(null);
  const [shouldOpenChatFromNotification, setShouldOpenChatFromNotification] = useState(false);
  const [activeChatAppointmentId, setActiveChatAppointmentId] = useState(null);
  // Preference to open specific chat at unread divider (set by notification click)
  const [preferUnreadForAppointmentId, setPreferUnreadForAppointmentId] = useState(null);

  // Missing chatbox error state
  const [missingChatbookError, setMissingChatbookError] = useState(null);

  // Export chat modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAppointment, setExportAppointment] = useState(null);
  const [exportComments, setExportComments] = useState([]);
  const [exportCallHistory, setExportCallHistory] = useState([]);

  // Call History modal state
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [callHistoryAppointmentId, setCallHistoryAppointmentId] = useState(null);

  // Call functionality - using global context
  const {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isMuted: isCallMuted,
    isVideoEnabled,
    callDuration,
    activeCall,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: toggleCallMute,
    toggleVideo
  } = useCallContext();

  // Handle initiate call
  const handleInitiateCall = async (appointment, callType, receiverId) => {
    if (!appointment || !appointment._id) {
      toast.error('Appointment not found');
      return;
    }
    
    try {
      await initiateCall(appointment._id, receiverId, callType);
    } catch (error) {
      console.error('Error initiating call:', error);
      // Error is already handled in useCall hook
    }
  };

  // Get other party name for active call
  const getOtherPartyName = (appointment) => {
    if (!appointment || !currentUser) return 'Calling...';
    if (appointment.buyerId._id === currentUser._id) {
      return appointment.sellerId?.username || 'Calling...';
    }
    return appointment.buyerId?.username || 'Calling...';
  };

  // Lock body scroll when archive modals are open
  useEffect(() => {
    const shouldLock = showArchiveModal || showUnarchiveModal;
    if (shouldLock) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showArchiveModal, showUnarchiveModal]);

  // Close audio menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-audio-menu]') && 
          !event.target.closest('[data-audio-speed-menu]') && 
          !event.target.closest('[data-audio-controls-menu]') && 
          !event.target.closest('button[title="Audio options"]')) {
        document.querySelectorAll('[data-audio-menu]').forEach(menu => {
          menu.classList.add('hidden');
        });
        document.querySelectorAll('[data-audio-speed-menu]').forEach(menu => {
          menu.classList.add('hidden');
        });
        document.querySelectorAll('[data-audio-controls-menu]').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) {
        setError("Please sign in to view your appointments");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch all appointments without pagination
        const { data } = await axios.get(`${API_BASE_URL}/api/bookings/my`, {
          withCredentials: true
        });
        
        console.log('All appointments fetched:', data);
        const allAppts = data.appointments || data;
        setAllAppointments(allAppts);
        
        // Just store all appointments, filtering and pagination will be handled in separate useEffect
      } catch (err) {
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    const fetchArchivedAppointments = async () => {
      // Fetch archived appointments for all users
      if (currentUser) {
        try {
          const { data } = await axios.get(`${API_BASE_URL}/api/bookings/archived`, {
            withCredentials: true
          });
          setArchivedAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
          setArchivedAppointments([]);
          console.error("Failed to fetch archived appointments:", err);
        }
      } else {
        setArchivedAppointments([]);
      }
    };
    fetchAppointments();
    fetchArchivedAppointments();
  }, [currentUser]);

  // Separate useEffect for pagination and filtering
  useEffect(() => {
    if (allAppointments.length === 0) return;
    
    // Apply filters
    let filteredAppts = allAppointments.filter((appt) => {
      if (currentUser._id === appt.buyerId?._id?.toString() && appt.visibleToBuyer === false) return false;
      if (currentUser._id === appt.sellerId?._id?.toString() && appt.visibleToSeller === false) return false;
      const isOutdated = new Date(appt.date) < new Date() || (new Date(appt.date).toDateString() === new Date().toDateString() && appt.time && appt.time < new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (statusFilter === 'outdated') {
        return isOutdated;
      }
      const matchesStatus = statusFilter === "all" ? true : appt.status === statusFilter;
      const matchesRole = roleFilter === "all" ? true : appt.role === roleFilter;
      const matchesSearch =
        appt.propertyName?.toLowerCase().includes(search.toLowerCase()) ||
        appt.buyerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.buyerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.username?.toLowerCase().includes(search.toLowerCase());
      const matchesDateRange = 
        (!startDate || new Date(appt.date) >= new Date(startDate)) &&
        (!endDate || new Date(appt.date) <= new Date(endDate));
      
      return matchesStatus && matchesRole && matchesSearch && matchesDateRange;
    });
    
    // Calculate pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAppts.length / itemsPerPage);
    setTotalPages(totalPages);
    
    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageAppts = filteredAppts.slice(startIndex, endIndex);
    
    console.log(`Page ${currentPage} of ${totalPages}, showing ${currentPageAppts.length} appointments`);
    setAppointments(currentPageAppts);
  }, [allAppointments, currentPage, search, statusFilter, roleFilter, startDate, endDate, currentUser]);

  // Separate useEffect for archived appointments pagination and filtering
  useEffect(() => {
    if (archivedAppointments.length === 0) return;
    
    // Apply filters to archived appointments
    let filteredArchivedAppts = archivedAppointments.filter((appt) => {
      const isOutdated = new Date(appt.date) < new Date() || (new Date(appt.date).toDateString() === new Date().toDateString() && appt.time && appt.time < new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "outdated" ? isOutdated :
        appt.status === statusFilter;
      const matchesRole = roleFilter === "all" ? true : appt.role === roleFilter;
      const matchesSearch =
        appt.propertyName?.toLowerCase().includes(search.toLowerCase()) ||
        appt.message?.toLowerCase().includes(search.toLowerCase()) ||
        appt.buyerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.username?.toLowerCase().includes(search.toLowerCase());
      const matchesDateRange = 
        (!startDate || new Date(appt.date) >= new Date(startDate)) &&
        (!endDate || new Date(appt.date) <= new Date(endDate));
      
      return matchesStatus && matchesRole && matchesSearch && matchesDateRange;
    });
    
    // Calculate pagination for archived appointments
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredArchivedAppts.length / itemsPerPage);
    setArchivedTotalPages(totalPages);
    
    // Get current page items for archived appointments
    const startIndex = (archivedCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageArchivedAppts = filteredArchivedAppts.slice(startIndex, endIndex);
    
    console.log(`Archived Page ${archivedCurrentPage} of ${totalPages}, showing ${currentPageArchivedAppts.length} archived appointments`);
    setFilteredArchivedAppointments(currentPageArchivedAppts);
  }, [archivedAppointments, archivedCurrentPage, search, statusFilter, roleFilter, startDate, endDate]);

  useEffect(() => {
    // Listen for permanent delete events
    const removeHandler = (e) => {
      setAppointments((prev) => prev.filter((appt) => appt._id !== e.detail));
    };
    window.addEventListener('removeAppointmentRow', removeHandler);
    return () => {
      window.removeEventListener('removeAppointmentRow', removeHandler);
    };
  }, [currentUser]);

  // Listen for notification clicks when already on MyAppointments page
  useEffect(() => {
    const handleNotificationClick = (e) => {
      const { appointmentId, preferUnread } = e.detail || {};
      if (appointmentId) {
        // Find the appointment and set the state directly
        const appointment = appointments.find(appt => appt._id === appointmentId);
        if (appointment) {
          setNotificationChatData(appointment);
          setShouldOpenChatFromNotification(true);
          setActiveChatAppointmentId(appointmentId);
          if (preferUnread) setPreferUnreadForAppointmentId(appointmentId);
        }
      }
    };
    
    window.addEventListener('openChatFromNotification', handleNotificationClick);
    return () => {
      window.removeEventListener('openChatFromNotification', handleNotificationClick);
    };
  }, [appointments]);

  // Listen for highlightAppointment events (from MyPayments page)
  useEffect(() => {
    const handleHighlightAppointment = (e) => {
      const { appointmentId } = e.detail || {};
      if (appointmentId) {
        // Find and highlight the appointment row
        setTimeout(() => {
          const appointmentRow = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
          if (appointmentRow) {
            appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            appointmentRow.classList.add('highlight-appointment');
            setTimeout(() => {
              appointmentRow.classList.remove('highlight-appointment');
            }, 3000);
          }
        }, 300);
      }
    };
    
    window.addEventListener('highlightAppointment', handleHighlightAppointment);
    return () => {
      window.removeEventListener('highlightAppointment', handleHighlightAppointment);
    };
  }, []);


  // Lock background scroll when profile modal is open
  useEffect(() => {
    if (showOtherPartyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOtherPartyModal]);

  // Prevent body scrolling when reinitiate modal is open
  useEffect(() => {
    if (showReinitiateModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showReinitiateModal]);

  // Dynamically update user info in appointments when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    setAppointments(prevAppointments => prevAppointments.map(appt => {
      const updated = { ...appt };
      
      // Update buyer info if current user is the buyer
      if (appt.buyerId && (appt.buyerId._id === currentUser._id || appt.buyerId === currentUser._id)) {
        updated.buyerId = {
          ...updated.buyerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      // Update seller info if current user is the seller
      if (appt.sellerId && (appt.sellerId._id === currentUser._id || appt.sellerId === currentUser._id)) {
        updated.sellerId = {
          ...updated.sellerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      return updated;
    }));
  }, [currentUser]);

  useEffect(() => {
    function handleAppointmentUpdate(data) {
      setAppointments((prev) =>
        prev.map(appt =>
          appt._id === data.appointmentId ? { ...appt, ...data.updatedAppointment } : appt
        )
      );
    }
    
    function handlePaymentStatusUpdate(data) {
      setAppointments((prev) =>
        prev.map(appt =>
          appt._id === data.appointmentId ? { ...appt, paymentConfirmed: data.paymentConfirmed } : appt
        )
      );
    }
    
    // Handle custom DOM events (fallback from MyPayments page)
    function handleCustomPaymentStatusUpdate(event) {
      const { appointmentId, paymentConfirmed } = event.detail;
      if (appointmentId) {
        setAppointments((prev) =>
          prev.map(appt =>
            appt._id === appointmentId ? { ...appt, paymentConfirmed: Boolean(paymentConfirmed) } : appt
          )
        );
      }
    }
    
    socket.on('appointmentUpdate', handleAppointmentUpdate);
    socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);
    window.addEventListener('paymentStatusUpdated', handleCustomPaymentStatusUpdate);
    
    return () => {
      socket.off('appointmentUpdate', handleAppointmentUpdate);
      socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
      window.removeEventListener('paymentStatusUpdated', handleCustomPaymentStatusUpdate);
    };
  }, []);

  useEffect(() => {
    function handleAppointmentCreated(data) {
      const appt = data.appointment;
      // Set role for the current user
      if (appt.buyerId && currentUser && (appt.buyerId._id === currentUser._id || appt.buyerId === currentUser._id)) {
        appt.role = 'buyer';
      } else if (appt.sellerId && currentUser && (appt.sellerId._id === currentUser._id || appt.sellerId === currentUser._id)) {
        appt.role = 'seller';
      }
      setAppointments((prev) => [appt, ...prev]);
    }
    socket.on('appointmentCreated', handleAppointmentCreated);
    
    // Listen for profile updates to update user info in appointments
    const handleProfileUpdate = (profileData) => {
      setAppointments(prevAppointments => prevAppointments.map(appt => {
        const updated = { ...appt };
        
        // Update buyer info if the updated user is the buyer
        if (appt.buyerId && (appt.buyerId._id === profileData.userId || appt.buyerId === profileData.userId)) {
          updated.buyerId = {
            ...updated.buyerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        // Update seller info if the updated user is the seller
        if (appt.sellerId && (appt.sellerId._id === profileData.userId || appt.sellerId === profileData.userId)) {
          updated.sellerId = {
            ...updated.sellerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        return updated;
      }));
    };
    socket.on('profileUpdated', handleProfileUpdate);
    
    return () => {
      socket.off('appointmentCreated', handleAppointmentCreated);
      socket.off('profileUpdated', handleProfileUpdate);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    // Emit userAppointmentsActive every 1 seconds
    const interval = setInterval(() => {
      socket.emit('userAppointmentsActive', { userId: currentUser._id });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle notification-triggered chat opening
  useEffect(() => {
    if (shouldOpenChatFromNotification && notificationChatData) {
      // The chat will be opened by the AppointmentRow component
      // which handles both locked and unlocked chats
    }
  }, [shouldOpenChatFromNotification, notificationChatData]);



  // Handle navigation state when coming from notification or direct chat link
  const location = useLocation();
  const { chatId } = useParams();
  const params = useParams();
  const chatResolveRef = useRef(false);
  const chatIntervalRef = useRef(null);
  const chatTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear any previous timers when dependencies change
    if (chatIntervalRef.current) {
      clearInterval(chatIntervalRef.current);
      chatIntervalRef.current = null;
    }
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current);
      chatTimeoutRef.current = null;
    }
    chatResolveRef.current = false;

    // Handle direct chat link via URL parameter
    if (params.chatId) {
      const chatIdFromUrl = params.chatId;

      const tryResolveChat = () => {
        const appointment = appointments.find(appt => appt._id === chatIdFromUrl);
        if (appointment) {
          chatResolveRef.current = true;
          setNotificationChatData(appointment);
          setShouldOpenChatFromNotification(true);
          setActiveChatAppointmentId(chatIdFromUrl);
          if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
          if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
        }
      };

      if (appointments.length > 0) {
        tryResolveChat();
      } else {
        // Poll until appointments are available
        chatIntervalRef.current = setInterval(() => {
          if (appointments.length > 0) {
            tryResolveChat();
            if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
          }
        }, 100);
      }

      // Fallback after 5s if still unresolved
      chatTimeoutRef.current = setTimeout(() => {
        if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
        if (!chatResolveRef.current) {
          setMissingChatbookError(chatIdFromUrl);
        }
      }, 5000);
    } else if (location.state?.fromNotification && location.state?.openChatForAppointment) {
      // Handle notification-triggered chat opening
      const appointmentId = location.state.openChatForAppointment;

      const tryResolveNotified = () => {
        const appointment = appointments.find(appt => appt._id === appointmentId);
        if (appointment) {
          chatResolveRef.current = true;
          setNotificationChatData(appointment);
          setShouldOpenChatFromNotification(true);
          setActiveChatAppointmentId(appointmentId);
          navigate(location.pathname, { replace: true });
          if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
          if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
        }
      };

      if (appointments.length > 0) {
        tryResolveNotified();
      } else {
        chatIntervalRef.current = setInterval(() => {
          if (appointments.length > 0) {
            tryResolveNotified();
            if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
          }
        }, 100);
      }

      chatTimeoutRef.current = setTimeout(() => {
        if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
        if (!chatResolveRef.current) {
          setMissingChatbookError(appointmentId);
        }
      }, 5000);
    }

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    };
  }, [location.state, navigate, appointments, currentUser?._id, params.chatId]);

  // Handle highlightAppointmentId from location.state (must be after location declaration)
  useEffect(() => {
    if (appointments.length === 0) return;
    
    const highlightAppointmentId = location.state?.highlightAppointmentId;
    
    if (highlightAppointmentId) {
      setTimeout(() => {
        const appointmentRow = document.querySelector(`[data-appointment-id="${highlightAppointmentId}"]`);
        if (appointmentRow) {
          appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          appointmentRow.classList.add('highlight-appointment');
          setTimeout(() => {
            appointmentRow.classList.remove('highlight-appointment');
          }, 3000);
        }
      }, 500);
      // Clear the state after highlighting
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.highlightAppointmentId, appointments.length, navigate, location.pathname]);

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id + status);
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${id}/status`, 
        { status },
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === id ? { ...appt, status } : appt))
      );
      const statusText = status === "accepted" ? "accepted" : "rejected";
      toast.success(`Appointment ${statusText} successfully! ${status === "accepted" ? "Contact information is now visible to both parties." : ""}`, {
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false
      });
      navigate("/user/my-appointments");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please sign in again.");
        navigate("/sign-in");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to update appointment status.");
    }
    setActionLoading("");
  };

  const handleAdminDelete = async (id) => {
    setAppointmentToHandle(id);
    setDeleteReason('');
    setShowDeleteAppointmentModal(true);
  };

  const confirmAdminDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deleting this appointment.');
      return;
    }
    
    try {
      const { data } = await axios.delete(`${API_BASE_URL}/api/bookings/${appointmentToHandle}`, { 
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        data: { reason: deleteReason }
      });
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === appointmentToHandle ? { ...appt, status: "deletedByAdmin", adminComment: deleteReason } : appt))
      );
      toast.success("Appointment deleted successfully. Both buyer and seller have been notified.", {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false
      });
      navigate("/user/my-appointments");
      setShowDeleteAppointmentModal(false);
      setAppointmentToHandle(null);
      setDeleteReason('');
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please sign in again.");
        navigate("/sign-in");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to delete appointment.");
    }
  };

  const handleArchiveAppointment = async (id) => {
    setAppointmentToHandle(id);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/archive`, 
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      const archivedAppt = appointments.find(appt => appt._id === appointmentToHandle);
      if (archivedAppt) {
        setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentToHandle));
        setArchivedAppointments((prev) => [{ ...archivedAppt, archivedAt: new Date() }, ...prev]);
      }
      toast.success("Appointment archived successfully.", {
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false
      });
      setShowArchiveModal(false);
      setAppointmentToHandle(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive appointment.");
    }
  };

  const handleUnarchiveAppointment = async (id) => {
    setAppointmentToHandle(id);
    setShowUnarchiveModal(true);
  };

  const confirmUnarchive = async () => {
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/unarchive`, 
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      const unarchivedAppt = archivedAppointments.find(appt => appt._id === appointmentToHandle);
      if (unarchivedAppt) {
        setArchivedAppointments((prev) => prev.filter((appt) => appt._id !== appointmentToHandle));
        setAppointments((prev) => [{ ...unarchivedAppt, archivedAt: undefined }, ...prev]);
      }
      toast.success("Appointment unarchived successfully.", {
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false
      });
      setShowUnarchiveModal(false);
      setAppointmentToHandle(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unarchive appointment.");
    }
  };

  // Filtering and pagination is now handled in useEffect
  // Use appointments directly since they are already filtered and paginated

  // Filtering and pagination for archived appointments is now handled in useEffect

  async function handleOpenReinitiate(appt) {
    // Fetch payment status to check if refunded
    let paymentStatus = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/history?appointmentId=${appt._id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.payments && data.payments.length > 0) {
          paymentStatus = data.payments[0];
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }

    setReinitiatePaymentStatus(paymentStatus);
    setReinitiateData({
      ...appt,
      date: appt.date ? new Date(appt.date).toISOString().split('T')[0] : '',
      time: appt.time || '',
      message: appt.message || '',
      buyerReinitiationCount: appt.buyerReinitiationCount || 0,
      sellerReinitiationCount: appt.sellerReinitiationCount || 0,
    });
    setShowReinitiateModal(true);
  }

  async function handleReinitiateSubmit(e) {
    e.preventDefault();
    if (!reinitiateData) return;
    const isBuyer = currentUser && (reinitiateData.buyerId?._id === currentUser._id || reinitiateData.buyerId === currentUser._id);
    const isSeller = currentUser && (reinitiateData.sellerId?._id === currentUser._id || reinitiateData.sellerId === currentUser._id);
    
    // Check if payment is refunded for cancelled appointment
    if ((reinitiateData.status === 'cancelledByBuyer' || reinitiateData.status === 'cancelledBySeller') && reinitiatePaymentStatus) {
      if (reinitiatePaymentStatus.status === 'refunded' || reinitiatePaymentStatus.status === 'partially_refunded') {
        toast.error('Reinitiation not possible now. Payment has been refunded for this cancelled appointment.');
        return;
      }
    }

    // Check 3-day (72-hour) window for cancelled appointments
    if (reinitiateData.status === 'cancelledByBuyer' || reinitiateData.status === 'cancelledBySeller') {
      const cancellationDate = reinitiateData.updatedAt ? new Date(reinitiateData.updatedAt) : new Date();
      const now = new Date();
      const hoursSinceCancellation = (now - cancellationDate) / (1000 * 60 * 60);
      
      if (hoursSinceCancellation > 72) {
        toast.error('Reinitiation not possible now. The 72-hour reinitiation window has expired.');
        return;
      }
    }

    const count = isBuyer ? (reinitiateData.buyerReinitiationCount || 0) : (reinitiateData.sellerReinitiationCount || 0);
    if (count >= 2) {
      toast.error('You have reached the maximum number of reinitiations for your role.');
      return;
    }
    if (!reinitiateData.buyerId || !reinitiateData.sellerId) {
      toast.error('Cannot reinitiate: one of the parties no longer exists.');
      return;
    }
    const payload = {
      ...reinitiateData,
      status: 'pending',
    };
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/bookings/reinitiate`, 
        payload,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      toast.success('Appointment reinitiated successfully!', {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false
      });
      setShowReinitiateModal(false);
      setReinitiateData(null);
      setReinitiatePaymentStatus(null);
      navigate("/user/my-appointments");
      setAppointments((prev) => prev.map(appt => appt._id === data.appointment._id ? { ...appt, ...data.appointment } : appt));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reinitiate appointment.');
    }
  }
//next
  const handleCancelRefresh = (cancelledId, cancelledStatus) => {
    setAppointments((prev) => prev.map(appt => appt._id === cancelledId ? { ...appt, status: cancelledStatus } : appt));
  };

  // Add this function to fetch latest data on demand
  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/bookings/my`, { 
        withCredentials: true 
      });
      setAppointments(data);
      
      // Fetch archived appointments for all users
      if (currentUser) {
        const { data: archivedData } = await axios.get(`${API_BASE_URL}/api/bookings/archived`, { 
          withCredentials: true 
        });
        setArchivedAppointments(Array.isArray(archivedData) ? archivedData : []);
      } else {
        setArchivedAppointments([]);
      }
    } catch (err) {
      setError('Failed to refresh appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to copy message to clipboard
  const copyMessageToClipboard = (messageText) => {
    if (!messageText) {
      toast.error('No message to copy');
      return;
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(messageText)
        .then(() => {
          toast.success('Copied', {
            autoClose: 2000,
            position: 'bottom-center'
          });
        })
        .catch(() => {
          // Fallback to older method
          copyWithFallback(messageText);
        });
    } else {
      // Use fallback method for older browsers
      copyWithFallback(messageText);
    }
  };

  // Fallback copy method
  const copyWithFallback = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        toast.success('Copied', {
          autoClose: 2000,
          position: 'bottom-center'
        });
      } else {
        console.error('Fallback copy failed');
        toast.error('Failed to copy message');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      toast.error('Copy not supported');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your appointments...</p>
      </div>
    </div>
  );

  if (error) {
    const handleRetry = async () => {
      if (!currentUser) return;
      try {
        setError(null);
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/api/bookings/my`, {
          withCredentials: true
        });
        const allAppts = data.appointments || data;
        setAllAppointments(allAppts);
        setError(null);
      } catch (err) {
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-10 px-2 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="text-center text-red-600 text-lg mb-4">{error}</div>
          <div className="text-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-10 px-2 md:px-8">
      {currentUser && (
        <div className="max-w-7xl mx-auto mb-4 flex justify-end">
          <Link to="/user/my-payments" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v3H2V7z" /><path d="M2 12h20v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5zm4 3a1 1 0 100 2h6a1 1 0 100-2H6z" /></svg>
            Go to Payments
          </Link>
        </div>
      )}

      {/* Camera Modal - Temporarily disabled */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-blue-700 drop-shadow">
              {showArchived ? `Archived Appointments (${filteredArchivedAppointments.length})` : `My Appointments (${appointments.length})`}
            </h3>
            {!showArchived && (
              <p className="text-sm text-gray-600 mt-1">
                💡 Monitor all appointments across the platform. Use the status filter to view appointments and interactive chatbox to connect with otherparty.
              </p>
            )}
          </div>
          <div className="flex flex-row gap-2 md:gap-4">
            <button
              onClick={handleManualRefresh}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-md text-xs sm:text-base sm:px-3 sm:py-1.5 sm:rounded-md flex-1 sm:flex-none sm:w-auto"
              title="Refresh appointments"
            >
              Refresh
            </button>
            {/* Archived appointments toggle for all users */}
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setCurrentPage(1); // Reset to first page when switching
                setArchivedCurrentPage(1); // Reset archived page to first page when switching
              }}
              className={`bg-gradient-to-r text-white px-2.5 py-1.5 rounded-md transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-base flex-1 sm:flex-none sm:w-auto sm:px-4 sm:py-2 sm:rounded-md justify-center ${
                showArchived 
                  ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                  : 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
              }`}
            >
              {showArchived ? (
                <>
                  <FaUndo /> <span>Active Appointments</span>
                </>
              ) : (
                <>
                  <FaArchive /> <span>Archived Appointments ({archivedAppointments.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-sm">Status:</label>
              <select
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Appointments</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelledByBuyer">Cancelled by Buyer</option>
                <option value="cancelledBySeller">Cancelled by Seller</option>
                <option value="cancelledByAdmin">Cancelled by Admin</option>
                <option value="deletedByAdmin">Deleted by Admin</option>
                <option value="completed">Completed</option>
                <option value="noShow">No Show</option>
                <option value="outdated">Outdated</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-sm">Role:</label>
              <select
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="buyer">As Buyer</option>
                <option value="seller">As Seller</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-sm">From:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
              <label className="font-semibold text-sm">To:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
            <div className="flex items-center gap-2">
              <FaSearch className="text-gray-500 hover:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm flex-1"
                placeholder="Search by property, message, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Description text for archived appointments */}
        {showArchived && (
          <p className="text-center text-gray-600 mb-6">
            📋 View and manage archived appointments. You can unarchive them to move them back to active appointments.
          </p>
        )}
        
        {/* Show archived appointments table for all users */}
        {showArchived ? (
          filteredArchivedAppointments.length === 0 ? (
            <div className="text-center text-gray-500 text-lg">No archived appointments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <th className="border p-2">Date & Time</th>
                    <th className="border p-2">Property</th>
                    <th className="border p-2">Role</th>
                    <th className="border p-2">Other Party</th>
                    <th className="border p-2">Purpose</th>
                    <th className="border p-2">Message</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Payment</th>
                    <th className="border p-2">Actions</th>
                    <th className="border p-2">Connect</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchivedAppointments.map((appt) => (
                    <AppointmentRow
                      key={appt._id}
                      appt={appt}
                      currentUser={currentUser}
                      handleStatusUpdate={handleStatusUpdate}
                      handleAdminDelete={handleAdminDelete}
                      actionLoading={actionLoading}
                      onShowOtherParty={(party, appointment) => { setSelectedOtherParty(party); setSelectedAppointment(appointment); setShowOtherPartyModal(true); }}
                      onOpenReinitiate={() => handleOpenReinitiate(appt)}
                      handleArchiveAppointment={handleArchiveAppointment}
                      handleUnarchiveAppointment={handleUnarchiveAppointment}
                      isArchived={true}
                      onCancelRefresh={handleCancelRefresh}
                      copyMessageToClipboard={copyMessageToClipboard}
                      onExportChat={(appointment, comments, callHistory) => {
                        setExportAppointment(appointment);
                        setExportComments(comments);
                        setExportCallHistory(callHistory || []);
                        setShowExportModal(true);
                      }}
                      onInitiateCall={handleInitiateCall}
                      callState={callState}
                      incomingCall={incomingCall}
                      activeCall={activeCall}
                      localVideoRef={localVideoRef}
                      remoteVideoRef={remoteVideoRef}
                      isCallMuted={isCallMuted}
                      isVideoEnabled={isVideoEnabled}
                      callDuration={callDuration}
                      onAcceptCall={acceptCall}
                      onRejectCall={rejectCall}
                      onEndCall={endCall}
                      onToggleCallMute={toggleCallMute}
                      onToggleVideo={toggleVideo}
                      getOtherPartyName={getOtherPartyName}
                      // Call History Modal props
                      setShowCallHistoryModal={setShowCallHistoryModal}
                      setCallHistoryAppointmentId={setCallHistoryAppointmentId}
                    />
                  ))}
                </tbody>
              </table>
          </div>
          )
        ) : (
          appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-6">No appointments found.</div>
              <Link 
                to="/search" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <FaCalendarAlt className="mr-2" />
                Book Appointment
              </Link>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
                  <th className="border p-2">Date & Time</th>
                  <th className="border p-2">Property</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Other Party</th>
                  <th className="border p-2">Purpose</th>
                  <th className="border p-2">Message</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Payment</th>
                  <th className="border p-2">Actions</th>
                  <th className="border p-2">Connect</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <AppointmentRow 
                    key={appt._id} 
                    appt={appt} 
                    currentUser={currentUser} 
                    handleStatusUpdate={handleStatusUpdate}
                    handleAdminDelete={handleAdminDelete}
                    actionLoading={actionLoading}
                    onShowOtherParty={(party, appointment) => { setSelectedOtherParty(party); setSelectedAppointment(appointment); setShowOtherPartyModal(true); }}
                    onOpenReinitiate={() => handleOpenReinitiate(appt)}
                      handleArchiveAppointment={handleArchiveAppointment}
                      handleUnarchiveAppointment={handleUnarchiveAppointment}
                      isArchived={false}
                      onCancelRefresh={handleCancelRefresh}
                      copyMessageToClipboard={copyMessageToClipboard}
                      activeChatAppointmentId={activeChatAppointmentId}
                      shouldOpenChatFromNotification={shouldOpenChatFromNotification}
                      onChatOpened={() => {
                        setShouldOpenChatFromNotification(false);
                        setActiveChatAppointmentId(null);
                      }}
                      preferUnreadForAppointmentId={preferUnreadForAppointmentId}
                      onConsumePreferUnread={(id) => {
                        if (preferUnreadForAppointmentId === id) setPreferUnreadForAppointmentId(null);
                      }}
                      onExportChat={(appointment, comments, callHistory) => {
                        setExportAppointment(appointment);
                        setExportComments(comments);
                        setExportCallHistory(callHistory || []);
                        setShowExportModal(true);
                      }}
                      onInitiateCall={handleInitiateCall}
                      callState={callState}
                      incomingCall={incomingCall}
                      activeCall={activeCall}
                      localVideoRef={localVideoRef}
                      remoteVideoRef={remoteVideoRef}
                      isCallMuted={isCallMuted}
                      isVideoEnabled={isVideoEnabled}
                      callDuration={callDuration}
                      onAcceptCall={acceptCall}
                      onRejectCall={rejectCall}
                      onEndCall={endCall}
                      onToggleCallMute={toggleCallMute}
                      onToggleVideo={toggleVideo}
                      getOtherPartyName={getOtherPartyName}
                      // Call History Modal props
                      setShowCallHistoryModal={setShowCallHistoryModal}
                      setCallHistoryAppointmentId={setCallHistoryAppointmentId}
                  />
                ))}
              </tbody>
            </table>
          </div>
          )
        )}

        {/* Pagination for regular appointments */}
        {!showArchived && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCurrentPage(Math.max(1, currentPage - 1));
                  toast.info(`Navigated to page ${Math.max(1, currentPage - 1)}`);
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                  toast.info(`Navigated to page ${Math.min(totalPages, currentPage + 1)}`);
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Pagination for archived appointments */}
        {showArchived && archivedTotalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
            <div className="text-sm text-gray-700">
              Archived Page {archivedCurrentPage} of {archivedTotalPages}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setArchivedCurrentPage(Math.max(1, archivedCurrentPage - 1));
                  toast.info(`Navigated to archived page ${Math.max(1, archivedCurrentPage - 1)}`);
                }}
                disabled={archivedCurrentPage === 1}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setArchivedCurrentPage(Math.min(archivedTotalPages, archivedCurrentPage + 1));
                  toast.info(`Navigated to archived page ${Math.min(archivedTotalPages, archivedCurrentPage + 1)}`);
                }}
                disabled={archivedCurrentPage === archivedTotalPages}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Next
              </button>
            </div>
          </div>
        )}

      {/* Other Party Details Modal - Enhanced Design */}
      {showOtherPartyModal && selectedOtherParty && selectedAppointment && createPortal((() => {
        // Determine if contact details should be shown based on appointment status
        const isUpcoming = new Date(selectedAppointment.date) > new Date() || (new Date(selectedAppointment.date).toDateString() === new Date().toDateString() && (!selectedAppointment.time || selectedAppointment.time > new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin');
        const canSeeContactInfo = (isAdmin || selectedAppointment.status === 'accepted') && isUpcoming && 
          selectedAppointment.status !== 'cancelledByBuyer' && selectedAppointment.status !== 'cancelledBySeller' && 
          selectedAppointment.status !== 'cancelledByAdmin' && selectedAppointment.status !== 'rejected' && 
          selectedAppointment.status !== 'deletedByAdmin';
        
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4" style={{ overflow: 'hidden' }}>
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto relative animate-fadeIn">
              {/* Close button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10 shadow"
                onClick={() => setShowOtherPartyModal(false)}
                title="Close"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
              
              {/* Header with gradient background */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-2xl px-6 py-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar 
                    user={{ username: selectedOtherParty.username, avatar: selectedOtherParty.avatar }} 
                    size="w-16 h-16" 
                    textSize="text-lg"
                    showBorder={true}
                    className="border-4 border-white shadow-lg"
                  />
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    {!canSeeContactInfo ? (
                      <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">N/A</span>
                      </div>
                    ) : selectedOtherParty.isTyping ? (
                      <div className="w-full h-full bg-yellow-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    ) : selectedOtherParty.isOnline ? (
                      <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                        <FaCircle className="w-2 h-2 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                        <FaCircle className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                    {selectedOtherParty.username || 'User'}
                    {selectedOtherParty.role === 'admin' && (
                      <FaUserShield className="text-purple-600 text-base" title="Admin user" />
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 capitalize font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                    {(() => {
                      // Determine the opposite role based on current user's role in the appointment
                      const currentUserRole = selectedAppointment.buyerId?._id === currentUser._id || selectedAppointment.buyerId === currentUser._id ? 'buyer' : 'seller';
                      return currentUserRole === 'buyer' ? 'seller' : 'buyer';
                    })()}
                  </p>
                  {/* Status text below role */}
                  {!canSeeContactInfo ? (
                    <div className="mt-2">
                      <span className="text-gray-600 font-medium text-xs bg-gray-100 px-3 py-1 rounded-full">
                        Not available
                      </span>
                    </div>
                  ) : selectedOtherParty.isTyping ? (
                    <div className="mt-2">
                      <span className="text-yellow-600 font-medium text-xs bg-yellow-100 px-3 py-1 rounded-full">
                        Typing...
                      </span>
                    </div>
                  ) : selectedOtherParty.isOnline ? (
                    <div className="mt-2">
                      <span className="text-green-600 font-medium text-xs bg-green-100 px-3 py-1 rounded-full">
                        Online
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-gray-600 font-medium text-xs bg-gray-100 px-3 py-1 rounded-full">
                        {(() => {
                          if (!selectedOtherParty.lastSeen) return 'Offline';
                          
                          const lastSeenDate = new Date(selectedOtherParty.lastSeen);
                          const now = new Date();
                          const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
                          const diffInHours = Math.floor(diffInMinutes / 60);
                          const diffInDays = Math.floor(diffInHours / 24);
                          
                          if (diffInMinutes < 1) {
                            return 'Last seen just now';
                          } else if (diffInMinutes < 60) {
                            return `Last seen ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
                          } else if (diffInHours < 24) {
                            return `Last seen ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                          } else if (diffInDays < 7) {
                            return `Last seen ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                          } else {
                            return `Last seen ${lastSeenDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}`;
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Body with enhanced styling */}
            <div className="px-6 py-6 space-y-4">
              <div className="space-y-4">
                {canSeeContactInfo ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <FaEnvelope className="text-blue-500 w-5 h-5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</p>
                        <a
                          href={`mailto:${selectedOtherParty.email}`}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                          title="Click to send email"
                        >
                          {selectedOtherParty.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                      <FaPhone className="text-green-500 w-5 h-5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Phone</p>
                        {selectedOtherParty.mobileNumber && selectedOtherParty.mobileNumber !== '' ? (
                          <button
                            onClick={() => handlePhoneClick(selectedOtherParty.mobileNumber)}
                            className="text-green-700 hover:text-green-800 hover:underline font-medium transition-colors duration-200 text-left"
                            title="Click to call or copy phone number"
                          >
                            {selectedOtherParty.mobileNumber}
                          </button>
                        ) : (
                          <p className="text-gray-800 font-medium">Not provided</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <FaExclamationTriangle className="text-yellow-500 w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 uppercase tracking-wide font-semibold">Contact Information Restricted</p>
                      <p className="text-yellow-800 font-medium">Contact details are only available for accepted appointments</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                  <FaCalendar className="text-purple-500 w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Member Since</p>
                    <p className="text-gray-800 font-medium">
                      {selectedOtherParty.createdAt ? new Date(selectedOtherParty.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
        );
      })(), document.body)}
      {/* Reinitiate Modal */}
      {showReinitiateModal && reinitiateData && (() => {
        // Calculate hours since cancellation (72-hour window)
        const isCancelled = reinitiateData.status === 'cancelledByBuyer' || reinitiateData.status === 'cancelledBySeller';
        const cancellationDate = reinitiateData.updatedAt ? new Date(reinitiateData.updatedAt) : new Date();
        const now = new Date();
        const hoursSinceCancellation = (now - cancellationDate) / (1000 * 60 * 60);
        const hoursLeft = 72 - hoursSinceCancellation;
        const daysLeft = Math.floor(hoursLeft / 24);
        const remainingHours = Math.floor(hoursLeft % 24);
        const isRefunded = reinitiatePaymentStatus && (reinitiatePaymentStatus.status === 'refunded' || reinitiatePaymentStatus.status === 'partially_refunded');
        const canReinitiate = !(isCancelled && (isRefunded || hoursSinceCancellation > 72));
        
        // Determine if current user is buyer or seller
        const isBuyer = currentUser && (reinitiateData.buyerId?._id === currentUser._id || reinitiateData.buyerId === currentUser._id);
        const isSeller = currentUser && (reinitiateData.sellerId?._id === currentUser._id || reinitiateData.sellerId === currentUser._id);
        const reinitiationCount = isBuyer ? (reinitiateData.buyerReinitiationCount || 0) : isSeller ? (reinitiateData.sellerReinitiationCount || 0) : 0;
        const maxReinitiations = 2;
        const reinitiationsLeft = maxReinitiations - reinitiationCount;

        return (
