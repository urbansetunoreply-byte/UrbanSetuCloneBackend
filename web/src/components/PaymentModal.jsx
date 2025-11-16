import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaCreditCard, FaDollarSign, FaShieldAlt, FaDownload, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Generate unique tab ID for cross-tab communication
const getTabId = () => {
  let tabId = sessionStorage.getItem('paymentTabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('paymentTabId', tabId);
  }
  return tabId;
};

// Cross-tab payment lock manager
const createPaymentLockManager = (appointmentId) => {
  const tabId = getTabId();
  const lockKey = `payment_lock_${appointmentId}`;
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`payment_${appointmentId}`) : null;
  let heartbeatInterval = null;
  let lockAcquired = false;

  // Try to acquire lock
  const acquireLock = () => {
    const lockData = localStorage.getItem(lockKey);
    const now = Date.now();
    
    if (lockData) {
      try {
        const { tabId: ownerTabId, timestamp } = JSON.parse(lockData);
        // If lock is older than 5 seconds without heartbeat, consider it stale
        if (now - timestamp > 5000 && ownerTabId !== tabId) {
          // Lock is stale, acquire it
          localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
          lockAcquired = true;
          startHeartbeat();
          return true;
        } else if (ownerTabId === tabId) {
          // We already own this lock
          lockAcquired = true;
          startHeartbeat();
          return true;
        } else {
          // Another tab owns the lock
          return false;
        }
      } catch (e) {
        // Invalid lock data, acquire it
        localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
        lockAcquired = true;
        startHeartbeat();
        return true;
      }
    } else {
      // No lock exists, acquire it
      localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: now }));
      lockAcquired = true;
      startHeartbeat();
      return true;
    }
  };

  // Release lock
  const releaseLock = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    const lockData = localStorage.getItem(lockKey);
    if (lockData) {
      try {
        const { tabId: ownerTabId } = JSON.parse(lockData);
        if (ownerTabId === tabId) {
          localStorage.removeItem(lockKey);
          if (channel) {
            channel.postMessage({ type: 'lock_released', tabId });
          }
        }
      } catch (e) {
        localStorage.removeItem(lockKey);
      }
    }
    lockAcquired = false;
  };

  // Start heartbeat to keep lock alive
  const startHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    heartbeatInterval = setInterval(() => {
      const lockData = localStorage.getItem(lockKey);
      if (lockData) {
        try {
          const { tabId: ownerTabId } = JSON.parse(lockData);
          if (ownerTabId === tabId) {
            localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: Date.now() }));
          } else {
            // Another tab owns the lock now
            releaseLock();
          }
        } catch (e) {
          releaseLock();
        }
      } else {
        releaseLock();
      }
    }, 2000); // Heartbeat every 2 seconds
  };

  // Check if lock is held by another tab
  const isLockedByAnotherTab = () => {
    const lockData = localStorage.getItem(lockKey);
    if (!lockData) return false;
    
    try {
      const { tabId: ownerTabId, timestamp } = JSON.parse(lockData);
      const now = Date.now();
      // If lock is stale (older than 5 seconds), consider it free
      if (now - timestamp > 5000) {
        return false;
      }
      return ownerTabId !== tabId;
    } catch (e) {
      return false;
    }
  };

  // Listen for lock release from other tabs
  const onLockReleased = (callback) => {
    if (!channel) return () => {};
    
    const handler = (event) => {
      if (event.data.type === 'lock_released') {
        callback();
      }
    };
    channel.addEventListener('message', handler);
    
    return () => {
      channel.removeEventListener('message', handler);
    };
  };

  // Cleanup
  const cleanup = () => {
    releaseLock();
    if (channel) {
      channel.close();
    }
  };

  return {
    acquireLock,
    releaseLock,
    isLockedByAnotherTab,
    onLockReleased,
    cleanup,
    lockAcquired: () => lockAcquired
  };
};

const PaymentModal = ({ isOpen, onClose, appointment, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState(() => (appointment?.region === 'india' ? 'razorpay' : 'paypal')); // 'paypal' or 'razorpay'
  const [expiryTimer, setExpiryTimer] = useState(null); // Timer for payment expiry (10 minutes)
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes in seconds
  const [paymentInitiatedTime, setPaymentInitiatedTime] = useState(null); // Store when payment was initiated
  const paymentDataRef = useRef(null); // Ref to access latest paymentData in timer callback
  const lockManagerRef = useRef(null); // Ref for payment lock manager

  // Cancel payment when modal is closed without completing
  const cancelPayment = async () => {
    if (paymentData && paymentData.payment && (paymentData.payment.status === 'pending' || paymentData.payment.status === 'processing')) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentId: paymentData.payment.paymentId
          })
        });
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }
  };

  // Handle modal close
  const handleClose = async () => {
    // Clear expiry timer
    setExpiryTimer((prevTimer) => {
      if (prevTimer) {
        clearInterval(prevTimer);
      }
      return null;
    });
    
    // Cancel payment if not completed - use ref to get latest paymentData
    const currentPaymentData = paymentDataRef.current;
    if (!paymentSuccess && currentPaymentData && currentPaymentData.payment && 
        (currentPaymentData.payment.status === 'pending' || currentPaymentData.payment.status === 'processing')) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentId: currentPaymentData.payment.paymentId
          })
        });
        toast.info('Payment session cancelled. You can pay later from My Appointments.');
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }
    
    // Reset states
    setTimeRemaining(10 * 60);
    setPaymentData(null);
    paymentDataRef.current = null;
    setPaymentSuccess(false);
    setPaymentInitiatedTime(null); // Reset initiation time
    
    onClose();
  };

  useEffect(() => {
    if (isOpen && appointment) {
      // Initialize lock manager for this appointment
      if (!lockManagerRef.current) {
        lockManagerRef.current = createPaymentLockManager(appointment._id);
      }
      
      // Try to acquire lock before opening modal
      if (!lockManagerRef.current.acquireLock()) {
        // Another tab has the payment modal open
        toast.warning('A payment session is already open for this appointment in another window/tab. Please close that window/tab first before opening a new payment session.');
        onClose();
        return;
      }
      
      // Listen for lock release from other tabs
      const removeLockListener = lockManagerRef.current.onLockReleased(() => {
        // Lock was released, but we're already open, so ignore
      });
      
      // Handle page unload to release lock
      const handleBeforeUnload = () => {
        if (lockManagerRef.current) {
          lockManagerRef.current.releaseLock();
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Initialize method from appointment region before creating intent
      const methodFromAppt = appointment?.region === 'india' ? 'razorpay' : 'paypal';
      setPreferredMethod(methodFromAppt);
      setPaymentData(null);
      paymentDataRef.current = null; // Reset ref
      setPaymentSuccess(false);
      setPaymentInitiatedTime(null); // Reset initiation time
      setTimeRemaining(10 * 60); // Reset timer to 10 minutes
      setLoading(true);
      setTimeout(() => createPaymentIntent(methodFromAppt), 0);
      
      return () => {
        removeLockListener();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      // Release lock when modal closes
      if (lockManagerRef.current) {
        lockManagerRef.current.releaseLock();
        lockManagerRef.current.cleanup();
        lockManagerRef.current = null;
      }
    }
    
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      // Cleanup on unmount
      if (expiryTimer) {
        clearInterval(expiryTimer);
      }
      if (lockManagerRef.current) {
        lockManagerRef.current.releaseLock();
        lockManagerRef.current.cleanup();
        lockManagerRef.current = null;
      }
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen, appointment, onClose]);

  // Handle payment expiry
  const handleExpiry = useCallback(async () => {
    toast.info('Payment session expired. Please initiate a new payment.');
    // Cancel payment if exists - use ref to get latest paymentData
    const currentPaymentData = paymentDataRef.current;
    if (currentPaymentData && currentPaymentData.payment && (currentPaymentData.payment.status === 'pending' || currentPaymentData.payment.status === 'processing')) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentId: currentPaymentData.payment.paymentId
          })
        });
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }
    setPaymentData(null);
    paymentDataRef.current = null;
    setPaymentSuccess(false);
    setPaymentInitiatedTime(null); // Reset initiation time
    setTimeRemaining(10 * 60);
    setExpiryTimer((prevTimer) => {
      if (prevTimer) {
        clearInterval(prevTimer);
      }
      return null;
    });
    onClose();
  }, [onClose]);

  // Timer effect: Start countdown when payment intent is created
  useEffect(() => {
    if (paymentData && paymentData.payment && !paymentSuccess) {
      // Clear any existing timer
      if (expiryTimer) {
        clearInterval(expiryTimer);
      }

      // Start countdown timer (10 minutes = 600 seconds)
      setTimeRemaining(10 * 60);
      
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time expired - cancel payment and close modal
            clearInterval(timer);
            handleExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setExpiryTimer(timer);

      return () => {
        clearInterval(timer);
      };
    } else {
      // Clear timer if payment completed or modal closed
      if (expiryTimer) {
        clearInterval(expiryTimer);
        setExpiryTimer(null);
      }
    }
  }, [paymentData, paymentSuccess, handleExpiry]);

  const createPaymentIntent = async (methodOverride) => {
    try {
      setLoading(true);
      
      // Check appointment status before creating payment intent
      if (appointment.status === 'rejected') {
        toast.error('This appointment has been rejected by the seller. Payment cannot be processed. Please book a new appointment or explore other alternatives.');
        onClose();
        return;
      }
      
      // Allow payment for pending or accepted appointments (not yet paid)
      if (appointment.status !== 'pending' && appointment.status !== 'accepted') {
        toast.error('This appointment is not in a payable status. Payment cannot be processed at this time.');
        onClose();
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: appointment._id,
          paymentType: 'advance',
          gateway: (methodOverride || preferredMethod) === 'razorpay' ? 'razorpay' : 'paypal'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentData(data);
        paymentDataRef.current = data; // Update ref
        // Store the payment initiation time (use payment createdAt or current time)
        const initiatedAt = data.payment?.createdAt ? new Date(data.payment.createdAt) : new Date();
        setPaymentInitiatedTime(initiatedAt);
        
        // Calculate remaining time based on expiresAt or createdAt + 10 minutes
        if (data.payment?.expiresAt) {
          const expiresAt = new Date(data.payment.expiresAt);
          const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
          setTimeRemaining(remaining);
        } else if (data.payment?.createdAt) {
          const createdAt = new Date(data.payment.createdAt);
          const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
          const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(10 * 60); // Default 10 minutes
        }
      } else {
        // Handle specific error cases
        if (response.status === 400 && data.message && data.message.includes('already completed')) {
          toast.success('Payment already completed!');
          // Call onPaymentSuccess with the existing payment
          if (data.payment) {
            onPaymentSuccess(data.payment);
          }
          // Payment already completed, no need to cancel
          setPaymentData(null);
          paymentDataRef.current = null;
          setPaymentSuccess(false);
          setPaymentInitiatedTime(null); // Reset initiation time
          if (expiryTimer) {
            clearInterval(expiryTimer);
            setExpiryTimer(null);
          }
          onClose();
        } else if (response.status === 409 && data.message && data.message.includes('already in progress')) {
          toast.warning('A payment is already in progress for this appointment. Please complete or cancel the existing payment first.');
          // Payment intent not created, no need to cancel
          setPaymentData(null);
          paymentDataRef.current = null;
          setPaymentSuccess(false);
          setPaymentInitiatedTime(null); // Reset initiation time
          if (expiryTimer) {
            clearInterval(expiryTimer);
            setExpiryTimer(null);
          }
          onClose();
        } else {
          toast.error(data.message || 'Failed to create payment intent');
        }
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('An error occurred while creating payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    try {
      setLoading(true);
      if (preferredMethod === 'razorpay') {
        // Load Razorpay Checkout
        const loadRazorpay = () => new Promise((resolve, reject) => {
          if (window && window.Razorpay) return resolve();
          const existing = document.querySelector('script[src*="checkout.razorpay.com/v1/checkout.js"]');
          if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')));
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
        await loadRazorpay();
        const rzpInfo = paymentData.razorpay;
        if (!rzpInfo) {
          toast.error('Razorpay not initialized');
          return;
        }
        const options = {
          key: rzpInfo.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: rzpInfo.amount,
          currency: rzpInfo.currency || 'INR',
          name: 'UrbanSetu',
          description: 'Advance Booking Payment',
          order_id: rzpInfo.orderId,
          prefill: {
            name: appointment?.buyerId?.username || '',
            email: appointment?.buyerId?.email || ''
          },
          handler: async (response) => {
            try {
              setProcessingPayment(true);
              await verifyRazorpay(response);
            } catch (e) {
              toast.error('Verification failed');
            } finally {
              setProcessingPayment(false);
            }
          },
          modal: { ondismiss: () => toast.info('Payment cancelled. You can try again later.') }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // Dynamically load PayPal SDK if not present
      const loadPayPalSDK = () => new Promise((resolve, reject) => {
        if (window && window.paypal) return resolve();
        const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', (e) => reject(new Error('Failed to load PayPal SDK')));
          return;
        }
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
        if (!clientId) return reject(new Error('Missing VITE_PAYPAL_CLIENT_ID'));
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
        document.body.appendChild(script);
      });

      await loadPayPalSDK();

      // Render PayPal Buttons
      if (window && window.paypal) {
        const amount = paymentData?.paypal?.amount || paymentData?.payment?.amount;
        const containerId = `paypal-button-container-${appointment._id}`;
        const existing = document.getElementById(containerId);
        if (existing) {
          existing.innerHTML = '';
        }
        window.paypal.Buttons({
          createOrder: async (_data, actions) => {
            try {
              const orderRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/paypal/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amount: Number(amount).toFixed(2), currency: 'USD' })
              });
              const text = await orderRes.text();
              let order;
              try { order = JSON.parse(text); } catch (e) {
                throw new Error(text || 'Invalid JSON from create-order');
              }
              if (!orderRes.ok) throw new Error(order.message || 'Failed to create PayPal order');
              return order.id;
            } catch (e) {
              toast.error('Failed to initialize PayPal');
              throw e;
            }
          },
          onApprove: async (data, actions) => {
            try {
              setProcessingPayment(true);
              // Capture via actions may fail if permissions; fallback to server capture
              try {
                await actions.order.capture();
              } catch (e) {
                await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/paypal/capture-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ orderId: data.orderID })
                });
              }
              await verifyPayment({ paypal_order_id: data.orderID });
            } catch (e) {
              toast.error('Payment capture failed');
            } finally {
              setProcessingPayment(false);
            }
          },
          onCancel: () => {
            toast.info('Payment cancelled. You can try again later.');
          },
          onError: (err) => {
            console.error('PayPal error', err);
            toast.error('Payment failed or cancelled.');
            // Mark payment as failed
            if (paymentData?.payment?.paymentId) {
              handlePaymentFailure('PayPal payment failed');
            }
          }
        }).render(`#${containerId}`);
      } else {
        toast.error('PayPal SDK not loaded.');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
    finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = async (reason) => {
    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentData.payment.paymentId,
          paymentStatus: 'failed',
          clientIp: (window && window.__CLIENT_IP__) || undefined,
          userAgent: navigator.userAgent
        })
      });

      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok || verifyResponse.status === 400) {
        // Payment marked as failed
        toast.error(`Payment failed: ${reason}`);
        setLoading(false);
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error marking payment as failed:', error);
      toast.error('Payment failed');
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  const verifyPayment = async (response) => {
    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentData.payment.paymentId,
          paypalOrderId: response.paypal_order_id || response.paypalOrderId || response.orderID,
          clientIp: (window && window.__CLIENT_IP__) || undefined,
          userAgent: navigator.userAgent
        })
      });

      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok) {
        setPaymentSuccess(true);
        setReceiptUrl(verifyData.receiptUrl);
        toast.success('Payment successful!');
        onPaymentSuccess(verifyData.payment);
      } else {
        toast.error(verifyData.message || 'Payment verification failed');
        if (verifyData.message && verifyData.message.toLowerCase().includes('signature')) {
          toast.info('Dev mode: signature bypass is enabled. Please try again.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyRazorpay = async (response) => {
    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/razorpay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentData.payment.paymentId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          clientIp: (window && window.__CLIENT_IP__) || undefined,
          userAgent: navigator.userAgent
        })
      });
      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok) {
        setPaymentSuccess(true);
        setReceiptUrl(verifyData.receiptUrl);
        toast.success('Payment successful!');
        onPaymentSuccess(verifyData.payment);
      } else {
        toast.error(verifyData.message || 'Payment verification failed');
        // If verification failed, mark payment as failed
        if (verifyResponse.status === 400) {
          await handlePaymentFailure('Razorpay verification failed');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment verification failed');
      await handlePaymentFailure('Razorpay verification error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ overscrollBehavior: 'contain' }}>
      <div className="rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50">
        {!paymentSuccess ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-700 flex items-center gap-2">
                  <FaCreditCard className="text-blue-600" />
                  Payment Required
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Complete your advance payment to confirm the booking
              </p>
              {paymentData && paymentData.payment && !paymentSuccess && (
                <div className="mt-4 p-3 rounded-lg border-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-gray-700 font-medium text-base">⏱️ Time remaining:</span>
                    <span className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                      timeRemaining < 60 
                        ? 'bg-red-100 text-red-700 border-2 border-red-400 animate-pulse' 
                        : timeRemaining < 300 
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-400' 
                        : 'bg-green-100 text-green-700 border-2 border-green-400'
                    }`}>
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  {timeRemaining < 300 && (
                    <p className="text-center mt-2 text-xs font-medium text-gray-600">
                      Please complete your payment soon
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="p-6">
              {processingPayment ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment...</h3>
                  <p className="text-gray-600 text-center">
                    Please wait while we verify your payment. Do not close this window.
                  </p>
                </div>
              ) : loading && !paymentData ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-blue-600" />
                  <span className="ml-2 text-gray-600">Preparing payment...</span>
                </div>
              ) : paymentData ? (
                <>
                  {/* Method Selection */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h5 className="font-semibold text-gray-800 mb-2">Select Region</h5>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name="region" value="india" checked={preferredMethod === 'razorpay'} onChange={() => { const m='razorpay'; setPreferredMethod(m); setLoading(true); setPaymentData(null); paymentDataRef.current = null; setPaymentInitiatedTime(null); setTimeout(() => createPaymentIntent(m), 0); }} />
                        <span>India (₹100 via Razorpay)</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name="region" value="international" checked={preferredMethod === 'paypal'} onChange={() => { const m='paypal'; setPreferredMethod(m); setLoading(true); setPaymentData(null); paymentDataRef.current = null; setPaymentInitiatedTime(null); setTimeout(() => createPaymentIntent(m), 0); }} />
                        <span>International ($5 via PayPal)</span>
                      </label>
                    </div>
                  </div>
                  {/* Property Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-800 mb-2">{appointment.propertyName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{appointment.propertyDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Appointment Date:</span>
                      <span className="text-sm font-medium">{new Date(appointment.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time:</span>
                      <span className="text-sm font-medium">{appointment.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500">Payment Initiated:</span>
                      <span className="text-sm font-medium">
                        {paymentInitiatedTime 
                          ? paymentInitiatedTime.toLocaleString('en-GB', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit' 
                            })
                          : paymentData.payment?.createdAt 
                            ? new Date(paymentData.payment.createdAt).toLocaleString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit' 
                              })
                            : new Date().toLocaleString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit' 
                              })
                        }
                      </span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-3">Payment Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Advance Payment (Flat)</span>
                        <span className="font-medium">
                          {preferredMethod === 'razorpay' ? `₹ ${Number((paymentData?.payment?.currency === 'INR' ? paymentData?.payment?.amount : 100)).toFixed(2)}` : `$ ${Number((paymentData?.payment?.currency === 'USD' ? paymentData?.payment?.amount : 5)).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Note</span>
                        <span>{preferredMethod === 'razorpay' ? '₹100 advance to confirm booking' : '$5 advance to confirm booking'}</span>
                      </div>
                    </div>
                    <div className="border-t border-blue-200 mt-3 pt-3">
                      <div className="flex justify-between font-semibold text-blue-800">
                        <span>Total Amount</span>
                        <span>{preferredMethod === 'razorpay' ? `₹ ${Number((paymentData?.payment?.currency === 'INR' ? paymentData?.payment?.amount : 100)).toFixed(2)}` : `$ ${Number((paymentData?.payment?.currency === 'USD' ? paymentData?.payment?.amount : 5)).toFixed(2)}`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
                    <h5 className="font-semibold text-gray-800 mb-2">Payment Platform</h5>
                    <div className="text-sm text-gray-700">{preferredMethod === 'razorpay' ? 'Razorpay' : 'PayPal'}</div>
                    <ul className="list-disc pl-5 mt-3 text-sm text-gray-600 space-y-1">
                      {preferredMethod === 'razorpay' ? (
                        <>
                          <li>Click "Pay via Razorpay" and complete payment in the Razorpay popup.</li>
                          <li>On approval, we verify and confirm your booking automatically.</li>
                        </>
                      ) : (
                        <>
                          <li>Click "Load PayPal Button" and complete payment in the PayPal popup.</li>
                          <li>On approval, we verify and confirm your booking automatically.</li>
                        </>
                      )}
                      <li>If you cancel or close PayPal, you can retry from My Appointments.</li>
                    </ul>
                  </div>

                  {/* Technical Details */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
                    <h5 className="font-semibold text-gray-800 mb-2">Payment Technical Details</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      {preferredMethod === 'razorpay' && paymentData?.razorpay && (
                        <>
                          <div>Order ID: <span className="font-mono">{paymentData.razorpay.orderId}</span></div>
                          <div>Amount (paise): <span className="font-mono">{paymentData.razorpay.amount}</span></div>
                        </>
                      )}
                      {preferredMethod === 'paypal' && (
                        <div>Amount: <span className="font-mono">{paymentData?.paypal?.amount || paymentData?.payment?.amount}</span> USD</div>
                      )}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <FaShieldAlt className="text-green-600 mt-1" />
                      <div>
                <h5 className="font-semibold text-green-800 mb-1">Secure Payment via {preferredMethod === 'razorpay' ? 'Razorpay' : 'PayPal'}</h5>
                <p className="text-sm text-green-700">Your payment is processed securely. You can request a full refund if the appointment is cancelled.</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
          <div className="space-y-2">
            {preferredMethod === 'paypal' && <div id={`paypal-button-container-${appointment._id}`} />}
            <button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow"
            >
              {loading ? 'Loading…' : (preferredMethod === 'razorpay' ? 'Pay via Razorpay' : 'Load PayPal Button')}
            </button>
          </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Failed to initialize payment. Please try again.</p>
                  <button
                    onClick={createPaymentIntent}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Success Screen */}
            <div className="p-6 text-center">
              <div className="mb-6">
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                <p className="text-gray-600">
                  Your advance payment has been processed successfully.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">$ {Number(paymentData.payment.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs">{paymentData.payment.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt No:</span>
                    <span className="font-mono text-xs">{paymentData.payment.receiptNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadReceipt}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Download Receipt
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    // Navigate to MyAppointments
                    window.location.href = '/user/my-appointments';
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View My Appointments
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
