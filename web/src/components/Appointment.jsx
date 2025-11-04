import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import ContactSupportWrapper from './ContactSupportWrapper';
import PaymentModal from './PaymentModal';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Appointment() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get listing information from URL params or state
  const searchParams = new URLSearchParams(location.search);
  const listingId = searchParams.get('listingId');
  const listingName = searchParams.get('propertyName');
  const listingDescription = searchParams.get('propertyDescription');
  const listingType = searchParams.get('listingType');
  
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    message: "",
    purpose: "",
    propertyName: listingName || "",
    propertyDescription: listingDescription || "",
  });
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [region, setRegion] = useState('international'); // 'india' or 'international'
  const [appointmentData, setAppointmentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'failed'
  const [showPaymentMessage, setShowPaymentMessage] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    async function checkActiveAppointment() {
      if (!currentUser || !listingId) {
        setHasActiveAppointment(false);
        setCheckingActive(false);
        return;
      }
      setCheckingActive(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/my`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Find active appointment for this property
          const activeStatuses = ["pending", "accepted"];
          const found = data.find(appt => {
            // Only check appointments where the current user is the buyer (not seller)
            if (!appt.buyerId || (appt.buyerId._id !== currentUser._id && appt.buyerId !== currentUser._id)) return false;
            
            if (!appt.listingId || (appt.listingId._id !== listingId && appt.listingId !== listingId)) return false;
            
            // Check if appointment is outdated (past date/time)
            const isOutdated = new Date(appt.date) < new Date() || (new Date(appt.date).toDateString() === new Date().toDateString() && appt.time && appt.time < new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            
            // Don't block if appointment is outdated
            if (isOutdated) return false;
            
            if (activeStatuses.includes(appt.status)) return true;
            // Only block if reinitiation is still possible for the current user (as buyer)
            if (appt.status === "cancelledByBuyer" && (appt.buyerReinitiationCount || 0) < 2) return true;
            return false;
          });
          setHasActiveAppointment(!!found);
        } else {
          setHasActiveAppointment(false);
        }
      } catch (err) {
        setHasActiveAppointment(false);
      } finally {
        setCheckingActive(false);
      }
    }
    checkActiveAppointment();
  }, [currentUser, listingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasActiveAppointment) {
      toast.info("You already have an active appointment for this property. Please complete, cancel, or wait for the other party to respond before booking again.");
      return;
    }

    if (!agreed) {
      toast.warning("You must agree to share your contact information with the seller to book an appointment.");
      return;
    }

    if (!currentUser) {
      toast.info("Please sign in to book an appointment.");
      navigate("/sign-in");
      return;
    }

    // Simple manual validation
    if (
      !formData.date ||
      !formData.time ||
      !formData.purpose ||
      !formData.propertyName ||
      !formData.propertyDescription
    ) {
      toast.warning("Please fill out all required fields before booking the appointment.");
      return;
    }

    if (!listingId) {
      toast.warning("Listing information is missing. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          listingId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Store appointment data and show payment modal
        setAppointmentData({ ...data.appointment, region });
        setShowPaymentModal(true);
      } else {
        toast.error(data.message || "Failed to book appointment.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment) => {
    setBooked(true);
    setShowPaymentModal(false);
    setPaymentStatus('success');
    setShowPaymentMessage(true);
    toast.success('Appointment booked and payment confirmed!');
    setTimeout(() => {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')) {
        navigate('/admin/appointments');
      } else {
        navigate('/user/my-appointments');
      }
    }, 2000);
  };

  const handlePaymentClose = () => {
    // Close payment modal without marking as booked or redirecting
    setShowPaymentModal(false);
    setPaymentStatus('failed');
    setShowPaymentMessage(true);
    toast.info('Payment not completed. Appointment remains pending until payment is confirmed.');
    // Navigate to appointments page after closing payment modal
    setTimeout(() => {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')) {
        navigate('/admin/appointments');
      } else {
        navigate('/user/my-appointments');
      }
    }, 2000);
  };

  if (!currentUser) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
          <div className="text-center text-red-600 text-xl font-semibold py-10">
            Please sign in to book an appointment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
        <h3 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
          Book Appointment
        </h3>
        {showPaymentMessage ? (
          <div className="text-center py-10">
            {paymentStatus === 'success' ? (
              <>
                <div className="text-green-600 text-xl font-semibold mb-2">Payment Successful!</div>
                <div className="text-gray-700 mb-2">Appointment booked successfully!</div>
                <div className="text-gray-600 text-sm mb-2">The property owner will review your request.</div>
                <div className="text-sm text-gray-500">Redirecting to Myappointments...</div>
              </>
            ) : (
              <>
                <div className="text-red-600 text-xl font-semibold mb-2">Payment Unsuccessful</div>
                <div className="text-gray-700 mb-2">Please complete your payment from Myppointments to confirm booking</div>
                <div className="text-sm text-gray-500">Redirecting to Myappointments...</div>
              </>
            )}
          </div>
        ) : booked ? (
          <div className="text-center py-10">
            <div className="text-green-600 text-xl font-semibold">Appointment booked successfully!</div>
            <div className="text-gray-700 mt-1">The property owner will review your request.</div>
            <div className="text-sm text-gray-500 mt-1">Redirecting to your appointments...</div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={()=>navigate('/user/movers')} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">Book Packers & Movers</button>
              <button onClick={()=>navigate('/user/services')} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm">On-Demand Services</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Purpose</option>
                {listingType === 'rent' && <option value="rent">Rent</option>}
                {(listingType === 'sale' || listingType === 'buy') && <option value="buy">Buy</option>}
              </select>
            </div>

            <input
              type="text"
              name="propertyName"
              value={formData.propertyName}
              onChange={handleChange}
              placeholder="Property Name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
              disabled
              required
            />
            
            <textarea
              name="propertyDescription"
              value={formData.propertyDescription}
              onChange={handleChange}
              placeholder="Property Description"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
              readOnly
              disabled
              required
            ></textarea>
            
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about your requirements... (Optional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
            ></textarea>
            
            {/* Agreement Checkbox */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="agreement"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                required
              />
              <label htmlFor="agreement" className="text-sm text-gray-700 select-none">
                I understand that <span className="font-semibold text-blue-700">my contact information and details will be shared with the seller</span> for this appointment.
              </label>
            </div>
            
            {/* Region Selection */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Select Region</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="region" value="india" checked={region === 'india'} onChange={() => setRegion('india')} />
                  <span>India (₹100 via Razorpay)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="region" value="international" checked={region === 'international'} onChange={() => setRegion('international')} />
                  <span>International ($5 via PayPal)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !agreed || hasActiveAppointment || checkingActive}
              >
                {checkingActive ? "Checking..." : loading ? "Booking..." : hasActiveAppointment ? "Already Booked" : "Book Appointment"}
              </button>
            </div>
            {hasActiveAppointment && (
              <div className="text-red-600 text-sm mt-2 text-center font-semibold">
                You already have an active appointment for this property. Please complete, cancel, or wait for the other party to respond before booking again.
              </div>
            )}
          </form>
        )}
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && appointmentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          appointment={appointmentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      <ContactSupportWrapper />
    </div>
  );
}
