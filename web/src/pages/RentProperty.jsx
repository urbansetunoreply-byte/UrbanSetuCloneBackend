import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
import { FaLock, FaCalendarAlt, FaMoneyBillWave, FaCheckCircle, FaChevronRight, FaHome, FaShieldAlt, FaFileContract } from "react-icons/fa";
import { usePageTitle } from '../hooks/usePageTitle';
import PaymentModal from '../components/PaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RentProperty() {
  // Set page title
  usePageTitle("Rent Property - Rent-Lock Agreement");

  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get listing information from URL params
  const searchParams = new URLSearchParams(location.search);
  const listingId = searchParams.get('listingId');
  
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [step, setStep] = useState(1); // 1: Plan Selection, 2: Contract Review, 3: Signing, 4: Payment, 5: Move-in
  const [formData, setFormData] = useState({
    rentLockPlan: '',
    customLockDuration: 12,
    moveInDate: '',
    bookingId: null
  });
  const [contract, setContract] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [booking, setBooking] = useState(null);

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) {
        toast.error("Listing ID is required.");
        navigate("/");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get/${listingId}`, {
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error("Failed to fetch listing");
        }

        const data = await res.json();
        if (data.success && data.listing) {
          const listingData = data.listing;
          
          // Only allow rental properties
          if (listingData.type !== 'rent') {
            toast.error("This property is not available for rent.");
            navigate(`/listing/${listingId}`);
            return;
          }

          setListing(listingData);
          
          // Set default plan if available
          if (listingData.rentLockPlans?.defaultPlan) {
            setFormData(prev => ({
              ...prev,
              rentLockPlan: listingData.rentLockPlans.defaultPlan
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Failed to load property details.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, navigate]);

  const handlePlanChange = (plan) => {
    setFormData(prev => ({
      ...prev,
      rentLockPlan: plan
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate plan selection
      if (!formData.rentLockPlan) {
        toast.error("Please select a rent-lock plan.");
        return;
      }
      
      if (formData.rentLockPlan === 'custom' && (!formData.customLockDuration || formData.customLockDuration < 1 || formData.customLockDuration > 60)) {
        toast.error("Custom lock duration must be between 1 and 60 months.");
        return;
      }

      // Create booking first
      try {
        setLoading(true);
        const bookingRes = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            listingId,
            date: formData.moveInDate || new Date().toISOString().split('T')[0],
            time: '12:00',
            message: `Rent-Lock Plan: ${formData.rentLockPlan}`,
            purpose: 'rent',
            propertyName: listing?.name || '',
            propertyDescription: listing?.description || '',
            rentLockPlanSelected: formData.rentLockPlan,
            customLockDuration: formData.rentLockPlan === 'custom' ? formData.customLockDuration : null
          })
        });

        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) {
          throw new Error(bookingData.message || "Failed to create booking");
        }

        setBooking(bookingData.booking);
        setFormData(prev => ({ ...prev, bookingId: bookingData.booking._id }));
        
        // Create contract
        const lockDuration = formData.rentLockPlan === '1_year' ? 12 :
                           formData.rentLockPlan === '3_year' ? 36 :
                           formData.rentLockPlan === '5_year' ? 60 :
                           formData.customLockDuration;

        const startDate = formData.moveInDate ? new Date(formData.moveInDate) : new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + lockDuration);

        const contractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            bookingId: bookingData.booking._id,
            rentLockPlan: formData.rentLockPlan,
            lockDuration,
            lockedRentAmount: listing?.monthlyRent || listing?.discountPrice || 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            paymentFrequency: 'monthly',
            dueDate: 1,
            securityDeposit: (listing?.monthlyRent || listing?.discountPrice || 0) * (listing?.securityDepositMonths || 2),
            maintenanceCharges: listing?.maintenanceCharges || 0,
            advanceRent: 0,
            moveInDate: startDate.toISOString()
          })
        });

        const contractData = await contractRes.json();
        if (!contractRes.ok) {
          throw new Error(contractData.message || "Failed to create contract");
        }

        setContract(contractData.contract);
        setStep(2); // Move to contract review
      } catch (error) {
        console.error("Error creating booking/contract:", error);
        toast.error(error.message || "Failed to proceed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setStep(3); // Move to signing
    } else if (step === 3) {
      // Signing handled by sign buttons
    }
  };

  const handleSign = async (isTenant) => {
    if (!contract) {
      toast.error("Contract not found.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts/${contract.contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signatureData: `signed_by_${isTenant ? 'tenant' : 'landlord'}_${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign contract");
      }

      if (data.isFullySigned) {
        toast.success("Contract signed successfully!");
        setContract(data.contract);
        setStep(4); // Move to payment
        setShowPaymentModal(true);
      } else {
        toast.success(isTenant ? "Your signature added. Waiting for landlord to sign." : "Your signature added. Waiting for tenant to sign.");
        setContract(data.contract);
        
        // If landlord signs, move tenant to payment step
        if (!isTenant && contract.tenantSignature?.signed) {
          setStep(4);
          setShowPaymentModal(true);
        }
      }
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Failed to sign contract. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment successful! Redirecting to your appointments...");
    setTimeout(() => {
      navigate("/user/my-appointments");
    }, 2000);
  };

  if (loading && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Property not found.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const lockDurationMonths = formData.rentLockPlan === '1_year' ? 12 :
                            formData.rentLockPlan === '3_year' ? 36 :
                            formData.rentLockPlan === '5_year' ? 60 :
                            formData.customLockDuration || 12;

  const monthlyRent = listing.monthlyRent || listing.discountPrice || 0;
  const securityDeposit = monthlyRent * (listing.securityDepositMonths || 2);
  const totalAmount = securityDeposit + monthlyRent; // Security deposit + first month rent

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step > s ? <FaCheckCircle /> : s}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 text-center">
                    {s === 1 ? 'Select Plan' : s === 2 ? 'Review Contract' : s === 3 ? 'Sign' : s === 4 ? 'Pay' : 'Move-in'}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Select Rent-Lock Plan</h2>
            
            {/* Property Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-2">{listing.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{listing.address || `${listing.city}, ${listing.state}`}</p>
              <p className="text-blue-600 font-semibold">₹{monthlyRent.toLocaleString('en-IN')}/month</p>
            </div>

            {/* Plan Selection */}
            <div className="space-y-4 mb-6">
              {(listing.rentLockPlans?.availablePlans || ['1_year', '3_year', '5_year']).map((plan) => (
                <label
                  key={plan}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.rentLockPlan === plan
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="rentLockPlan"
                    value={plan}
                    checked={formData.rentLockPlan === plan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FaLock className="text-blue-600 mr-2" />
                      <span className="font-semibold text-lg">
                        {plan === '1_year' ? '1 Year Rent-Lock' :
                         plan === '3_year' ? '3 Year Rent-Lock' :
                         plan === '5_year' ? '5 Year Secure Plan' :
                         'Custom Duration'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {plan === '1_year' ? 'Rent locked for 12 months' :
                       plan === '3_year' ? 'Rent locked for 36 months' :
                       plan === '5_year' ? 'Rent locked for 60 months' :
                       'Custom lock duration'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Duration Input */}
            {formData.rentLockPlan === 'custom' && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Custom Lock Duration (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.customLockDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, customLockDuration: parseInt(e.target.value) || 12 }))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Move-in Date */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Move-in Date (Optional)
              </label>
              <input
                type="date"
                value={formData.moveInDate}
                onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Rent:</span>
                  <span className="font-semibold">₹{monthlyRent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lock Duration:</span>
                  <span className="font-semibold">{lockDurationMonths} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit ({listing.securityDepositMonths || 2} months):</span>
                  <span className="font-semibold">₹{securityDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold">Total (Security + 1st Month):</span>
                  <span className="font-semibold text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Processing...' : 'Continue to Contract Review'}
              <FaChevronRight className="ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Contract Review */}
        {step === 2 && contract && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Review Contract Terms</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Contract Details</h3>
                <p><strong>Contract ID:</strong> {contract.contractId}</p>
                <p><strong>Lock Duration:</strong> {contract.lockDuration} months</p>
                <p><strong>Monthly Rent:</strong> ₹{contract.lockedRentAmount.toLocaleString('en-IN')}</p>
                <p><strong>Security Deposit:</strong> ₹{contract.securityDeposit.toLocaleString('en-IN')}</p>
                <p><strong>Start Date:</strong> {new Date(contract.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString()}</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-2">Important Terms</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Rent is locked at ₹{contract.lockedRentAmount.toLocaleString('en-IN')} per month for {contract.lockDuration} months</li>
                  <li>No rent increases during the lock period</li>
                  <li>Security deposit of ₹{contract.securityDeposit.toLocaleString('en-IN')} will be held in escrow</li>
                  <li>Monthly rent due on day {contract.dueDate} of each month</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
            >
              Continue to Signing
              <FaChevronRight className="ml-2" />
            </button>
          </div>
        )}

        {/* Step 3: Signing */}
        {step === 3 && contract && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Sign Contract</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Tenant Signature</h3>
                    <p className="text-sm text-gray-600">{currentUser.username || currentUser.email}</p>
                  </div>
                  {contract.tenantSignature?.signed ? (
                    <FaCheckCircle className="text-green-600 text-2xl" />
                  ) : (
                    <button
                      onClick={() => handleSign(true)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Sign
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 border-2 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Landlord Signature</h3>
                    <p className="text-sm text-gray-600">Property Owner</p>
                  </div>
                  {contract.landlordSignature?.signed ? (
                    <FaCheckCircle className="text-green-600 text-2xl" />
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </div>
              </div>
            </div>

            {contract.tenantSignature?.signed && contract.landlordSignature?.signed && (
              <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                <p className="text-green-700 font-semibold text-center">
                  <FaCheckCircle className="inline mr-2" />
                  Contract Fully Signed! Proceed to Payment.
                </p>
              </div>
            )}

            {contract.tenantSignature?.signed && (
              <button
                onClick={() => {
                  setStep(4);
                  setShowPaymentModal(true);
                }}
                disabled={!contract.landlordSignature?.signed || loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contract.landlordSignature?.signed ? 'Proceed to Payment' : 'Waiting for Landlord Signature'}
              </button>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && step === 4 && booking && contract && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            appointment={booking}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}

