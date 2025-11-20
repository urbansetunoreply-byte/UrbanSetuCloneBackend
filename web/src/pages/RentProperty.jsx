import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
import { FaLock, FaCalendarAlt, FaMoneyBillWave, FaCheckCircle, FaChevronRight, FaHome, FaShieldAlt, FaFileContract, FaTimesCircle, FaCreditCard, FaChevronLeft } from "react-icons/fa";
import { usePageTitle } from '../hooks/usePageTitle';
import PaymentModal from '../components/PaymentModal';
import ContractPreview from '../components/rental/ContractPreview';
import DigitalSignature from '../components/rental/DigitalSignature';

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
  const contractIdParam = searchParams.get('contractId'); // For resuming contracts
  
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
  const [resumingContract, setResumingContract] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingAs, setSigningAs] = useState(null); // 'tenant' or 'landlord'

  // Fetch listing details and resume contract if contractId is provided
  useEffect(() => {
    const fetchListingAndContract = async () => {
      if (!listingId) {
        toast.error("Listing ID is required.");
        navigate("/user");
        return;
      }

      try {
        setLoading(true);

        // Fetch listing
        const res = await fetch(`${API_BASE_URL}/api/listing/get/${listingId}`, {
          credentials: 'include'
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch listing");
        }

        const data = await res.json();
        
        // Handle both response formats: {success, listing} or direct listing object
        const listingData = data.listing || (data._id ? data : null);
        
        if (!listingData || !listingData._id) {
          throw new Error("Listing not found");
        }
        
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

        // If contractId is provided, fetch and resume contract
        if (contractIdParam) {
          try {
            const contractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractIdParam}`, {
              credentials: 'include'
            });

            if (contractRes.ok) {
              const contractData = await contractRes.json();
              const existingContract = contractData.contract || contractData;
              
              if (existingContract && existingContract._id) {
                // Check if contract is rejected or terminated
                if (existingContract.status === 'rejected' || existingContract.status === 'terminated') {
                  setContract(existingContract);
                  setResumingContract(true);
                  setLoading(false);
                  
                  // Show rejection message
                  const rejectionMessage = existingContract.status === 'rejected'
                    ? `This contract was rejected by the seller${existingContract.rejectionReason ? `: ${existingContract.rejectionReason}` : ''}. Please try booking a new one.`
                    : `This contract was terminated${existingContract.terminationReason ? `: ${existingContract.terminationReason}` : ''}. Please try booking a new one.`;
                  
                  toast.error(rejectionMessage);
                  return; // Stop further processing
                }
                
                setContract(existingContract);
                setResumingContract(true);
                
                // Determine which step to resume from based on contract status and signatures
                let resumeStep = 1;
                const tenantSigned = existingContract.tenantSignature?.signed || false;
                const landlordSigned = existingContract.landlordSignature?.signed || false;
                const isTenant = currentUser?._id === existingContract.tenantId?._id || currentUser?._id === existingContract.tenantId;
                
                if (existingContract.status === 'draft') {
                  // Draft contracts: start from plan selection (step 1) if plan not set, otherwise contract review (step 2)
                  if (existingContract.rentLockPlan) {
                    resumeStep = 2; // Contract review step
                  } else {
                    resumeStep = 1; // Plan selection step
                  }
                } else if (existingContract.status === 'pending_signature') {
                  // Pending signature: check who needs to sign
                  if (isTenant && !tenantSigned) {
                    // Tenant hasn't signed yet - go to signing step
                    resumeStep = 3;
                  } else if (!isTenant && !landlordSigned) {
                    // Landlord hasn't signed yet - but this page is for tenant, so show signing status
                    resumeStep = 3;
                  } else if (!tenantSigned || !landlordSigned) {
                    // One party hasn't signed - show signing step
                    resumeStep = 3;
                  } else {
                    // Both signed - proceed to payment
                    resumeStep = 4;
                  }
                } else if (existingContract.status === 'active') {
                  // Active contract - check if payment was made (wallet exists)
                  if (existingContract.walletId) {
                    resumeStep = 5; // Move-in step (payment already done)
                  } else {
                    resumeStep = 4; // Payment step (contract signed but payment pending)
                  }
                } else if (existingContract.status === 'rejected' || existingContract.status === 'terminated') {
                  // Already handled above, but just in case
                  setLoading(false);
                  return;
                } else {
                  // Default to contract review step
                  resumeStep = 2;
                }

                setStep(resumeStep);
                setFormData(prev => ({
                  ...prev,
                  rentLockPlan: existingContract.rentLockPlan || prev.rentLockPlan,
                  customLockDuration: existingContract.lockDuration || prev.customLockDuration,
                  moveInDate: existingContract.moveInDate ? new Date(existingContract.moveInDate).toISOString().split('T')[0] : prev.moveInDate,
                  bookingId: existingContract.bookingId?._id || existingContract.bookingId || prev.bookingId
                }));

                toast.info('Resuming your contract from where you left off.');
              }
            }
          } catch (contractError) {
            console.error("Error fetching contract:", contractError);
            // Continue with normal flow if contract fetch fails
          }
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error(error.message || "Failed to load property details.");
        navigate("/user");
      } finally {
        setLoading(false);
      }
    };

    fetchListingAndContract();
  }, [listingId, contractIdParam, currentUser, navigate]);

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

      // Validate move-in date is required
      if (!formData.moveInDate || formData.moveInDate.trim() === '') {
        toast.error("Please select a move-in date. You can modify it later if needed.");
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
            customLockDuration: formData.rentLockPlan === 'custom' ? formData.customLockDuration : null,
            visibleToBuyer: false, // Hide booking until payment is complete
            visibleToSeller: false // Hide booking until payment is complete
          })
        });

        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) {
          throw new Error(bookingData.message || "Failed to create booking");
        }

        // Validate booking data structure - booking API returns 'appointment', not 'booking'
        const booking = bookingData.appointment || bookingData.booking || bookingData;
        if (!booking || !booking._id) {
          throw new Error("Invalid booking data received. Please try again.");
        }

        setBooking(booking);
        setFormData(prev => ({ ...prev, bookingId: booking._id }));
        
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
            bookingId: booking._id,
            rentLockPlan: formData.rentLockPlan,
            lockDuration,
            lockedRentAmount: listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            paymentFrequency: 'monthly',
            dueDate: 1,
            securityDeposit: (listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0) * (listing?.securityDepositMonths || 2),
            maintenanceCharges: listing?.maintenanceCharges || 0,
            advanceRent: 0,
            moveInDate: startDate.toISOString()
          })
        });

        const contractData = await contractRes.json();
        if (!contractRes.ok) {
          throw new Error(contractData.message || "Failed to create contract");
        }

        // Validate contract data structure
        const contract = contractData.contract || contractData;
        if (!contract) {
          throw new Error("Invalid contract data received. Please try again.");
        }

        // Get contract ID (check both contractId and _id)
        const contractId = contract.contractId || contract._id;
        if (!contractId) {
          throw new Error("Contract ID not found. Please try again.");
        }

        // Fetch full contract details with populated fields
        try {
          const fullContractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}`, {
            credentials: 'include'
          });
          
          if (fullContractRes.ok) {
            const fullContractData = await fullContractRes.json();
            if (fullContractData.success && fullContractData.contract) {
              setContract(fullContractData.contract);
            } else if (fullContractData.contract) {
              setContract(fullContractData.contract);
            } else {
              // Fallback to contract from create response
              setContract(contract);
            }
          } else {
            // If fetch fails, use contract from create response
            setContract(contract);
          }
        } catch (fetchError) {
          console.error("Error fetching full contract details:", fetchError);
          // Fallback to contract from create response
          setContract(contract);
        }
        
        setStep(2); // Move to contract review
      } catch (error) {
        console.error("Error creating booking/contract:", error);
        toast.error(error.message || "Failed to proceed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      // Contract review - user can proceed to signing
      setStep(3); // Move to signing
    } else if (step === 3) {
      // Signing handled by sign buttons and signature component
      // If both signed, move to payment
      if (contract?.tenantSignature?.signed && contract?.landlordSignature?.signed) {
        setStep(4);
        setShowPaymentModal(true);
      } else {
        toast.info("Please sign the contract before proceeding.");
      }
    }
  };

  const handleSignClick = (isTenant) => {
    // Check if already signed
    if (isTenant && contract.tenantSignature?.signed) {
      toast.info("You have already signed this contract.");
      return;
    }
    if (!isTenant && contract.landlordSignature?.signed) {
      toast.info("Landlord has already signed this contract.");
      return;
    }
    
    setSigningAs(isTenant ? 'tenant' : 'landlord');
    setShowSignatureModal(true);
  };

  const handleSignatureConfirm = async (signatureData) => {
    if (!contract) {
      toast.error("Contract not found.");
      return;
    }

    // Determine if user is tenant or landlord if signingAs is not set (e.g., inline signature)
    let roleToSign = signingAs;
    if (!roleToSign) {
      const isTenantUser = currentUser?._id === contract.tenantId?._id || 
                          currentUser?._id === contract.tenantId ||
                          String(currentUser?._id) === String(contract.tenantId?._id) ||
                          String(currentUser?._id) === String(contract.tenantId);
      roleToSign = isTenantUser ? 'tenant' : 'landlord';
    }

    if (!roleToSign) {
      toast.error("Unable to determine your role in this contract.");
      return;
    }

    const isTenant = roleToSign === 'tenant';

    try {
      setLoading(true);
      
      // Get contract ID - prefer contractId string field, then _id
      const contractId = contract?.contractId || contract?._id;
      if (!contractId) {
        throw new Error("Contract ID not found. Please refresh and try again.");
      }

      console.log('Signing contract with ID:', contractId, 'Contract:', contract);

      const res = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signatureData: signatureData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign contract");
      }

      // Refresh contract details after signing
      if (data.contract) {
        setContract(data.contract);
      } else {
        // If contract not in response, fetch it again
        const contractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}`, {
          credentials: 'include'
        });
        if (contractRes.ok) {
          const contractData = await contractRes.json();
          if (contractData.success && contractData.contract) {
            setContract(contractData.contract);
          }
        }
      }
      
      setShowSignatureModal(false);
      setSigningAs(null);

      if (data.isFullySigned) {
        toast.success("Contract fully signed by both parties!");
        setContract(data.contract);
        setStep(4); // Move to payment
        setShowPaymentModal(true);
      } else {
        toast.success(isTenant ? "Your signature added. Waiting for landlord to sign." : "Your signature added. Waiting for tenant to sign.");
        
        // If landlord signs and tenant already signed, move to payment
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

  const handlePaymentSuccess = async () => {
    // Make booking visible after payment succeeds
    if (booking?._id) {
      try {
        await fetch(`${API_BASE_URL}/api/bookings/${booking._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            visibleToBuyer: true,
            visibleToSeller: true
          })
        });
      } catch (error) {
        console.error("Error updating booking visibility:", error);
      }
    }

    toast.success("Payment successful! Proceeding to Move-in step...");
    // Move to step 5 (Move-in)
    setStep(5);
    setShowPaymentModal(false);
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
            onClick={() => navigate("/user")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <FaHome /> Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show rejection message if contract is rejected or terminated
  if (contract && (contract.status === 'rejected' || contract.status === 'terminated')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {contract.status === 'rejected' ? 'Contract Rejected' : 'Contract Terminated'}
              </h2>
              <p className="text-gray-600 mb-4">
                {contract.status === 'rejected' 
                  ? 'This contract was rejected by the seller before completion.'
                  : 'This contract was terminated before completion.'}
              </p>
              {contract.rejectionReason && contract.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <p className="font-semibold text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-red-700">{contract.rejectionReason}</p>
                </div>
              )}
              {contract.terminationReason && contract.status === 'terminated' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-left">
                  <p className="font-semibold text-orange-800 mb-1">Termination Reason:</p>
                  <p className="text-orange-700">{contract.terminationReason}</p>
                </div>
              )}
              {(contract.rejectedAt || contract.terminatedAt) && (
                <p className="text-sm text-gray-500 mb-4">
                  {contract.status === 'rejected' ? 'Rejected' : 'Terminated'} on{' '}
                  {new Date(contract.rejectedAt || contract.terminatedAt).toLocaleString('en-GB')}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(`/user/rent-property?listingId=${listingId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaLock /> Book New Contract
              </button>
              <button
                onClick={() => navigate("/user/rental-contracts")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                <FaFileContract /> View All Contracts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lockDurationMonths = formData.rentLockPlan === '1_year' ? 12 :
                            formData.rentLockPlan === '3_year' ? 36 :
                            formData.rentLockPlan === '5_year' ? 60 :
                            formData.customLockDuration || 12;

  const monthlyRent = listing.monthlyRent || listing.discountPrice || listing.regularPrice || 0;
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
                Move-in Date <span className="text-gray-500 text-sm font-normal">(can be modified later)</span>
              </label>
              <input
                type="date"
                value={formData.moveInDate}
                onChange={(e) => setFormData(prev => ({ ...prev, moveInDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
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
              disabled={loading || !formData.moveInDate || formData.moveInDate.trim() === ''}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Processing...' : 'Continue to Contract Review'}
              <FaChevronRight className="ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Contract Review */}
        {step === 2 && contract && listing && (
          <div className="space-y-6">
            <ContractPreview 
              contract={contract} 
              listing={listing}
              tenant={currentUser}
              landlord={contract.landlordId}
              onDownload={() => toast.success("Contract PDF downloaded!")}
            />
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (step > 1) {
                      setStep(step - 1);
                    }
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <FaChevronLeft /> Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
                >
                  Continue to Signing
                  <FaChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Signing */}
        {step === 3 && contract && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaFileContract /> Sign Contract
            </h2>
            
            <div className="space-y-6 mb-6">
              {/* Tenant Signature */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Tenant Signature</h3>
                    <p className="text-sm text-gray-600">{currentUser.username || currentUser.email}</p>
                  </div>
                  {contract.tenantSignature?.signed && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FaCheckCircle className="text-2xl" />
                      <span className="font-semibold">Signed</span>
                    </div>
                  )}
                </div>
                {contract.tenantSignature?.signed ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Signed on {new Date(contract.tenantSignature.signedAt).toLocaleString('en-GB')}
                    </p>
                    {contract.tenantSignature.signatureData && (
                      <img 
                        src={contract.tenantSignature.signatureData} 
                        alt="Tenant signature" 
                        className="mt-2 border border-gray-300 rounded bg-white"
                        style={{ maxHeight: '80px' }}
                      />
                    )}
                  </div>
                ) : (
                  <DigitalSignature
                    title="Tenant Signature"
                    userName={currentUser.username || currentUser.email}
                    onSign={(signatureData) => {
                      setSigningAs('tenant');
                      handleSignatureConfirm(signatureData);
                    }}
                    disabled={loading}
                  />
                )}
              </div>

              {/* Landlord Signature */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Landlord Signature</h3>
                    <p className="text-sm text-gray-600">Property Owner</p>
                  </div>
                  {contract.landlordSignature?.signed ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <FaCheckCircle className="text-2xl" />
                      <span className="font-semibold">Signed</span>
                    </div>
                  ) : (
                    <span className="text-yellow-600 font-semibold">Pending</span>
                  )}
                </div>
                {contract.landlordSignature?.signed ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Signed on {new Date(contract.landlordSignature.signedAt).toLocaleString('en-GB')}
                    </p>
                    {contract.landlordSignature.signatureData && (
                      <img 
                        src={contract.landlordSignature.signatureData} 
                        alt="Landlord signature" 
                        className="mt-2 border border-gray-300 rounded bg-white"
                        style={{ maxHeight: '80px' }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-gray-500">
                      Waiting for landlord to sign the contract
                    </p>
                  </div>
                )}
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

            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  }
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronLeft /> Back
              </button>
              {contract.tenantSignature?.signed && (
                <button
                  onClick={() => {
                    if (contract.landlordSignature?.signed) {
                      setStep(4);
                      setShowPaymentModal(true);
                    } else {
                      toast.info("Waiting for landlord to sign the contract.");
                    }
                  }}
                  disabled={!contract.landlordSignature?.signed || loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {contract.landlordSignature?.signed ? 'Proceed to Payment' : 'Waiting for Landlord Signature'}
                  {contract.landlordSignature?.signed && <FaChevronRight className="ml-2" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Signature Modal (if needed for separate modal flow) */}
        {showSignatureModal && signingAs && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {signingAs === 'tenant' ? 'Sign as Tenant' : 'Sign as Landlord'}
              </h3>
              <DigitalSignature
                title={`${signingAs === 'tenant' ? 'Tenant' : 'Landlord'} Signature`}
                userName={signingAs === 'tenant' ? (currentUser.username || currentUser.email) : 'Property Owner'}
                onSign={handleSignatureConfirm}
                onCancel={() => {
                  setShowSignatureModal(false);
                  setSigningAs(null);
                }}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && booking && contract && listing && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaMoneyBillWave /> Payment Required
            </h2>
            
            {/* Payment Summary */}
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monthly Rent (Locked):</span>
                  <span className="font-semibold">₹{(contract.lockedRentAmount || listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Security Deposit ({(listing?.securityDepositMonths || 2)} months):</span>
                  <span className="font-semibold">₹{(contract.securityDeposit || (listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0) * (listing?.securityDepositMonths || 2)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">First Month Rent:</span>
                  <span className="font-semibold">₹{(contract.lockedRentAmount || listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold text-lg">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">₹{((contract.securityDeposit || (listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0) * (listing?.securityDepositMonths || 2)) + (contract.lockedRentAmount || listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Please complete the payment for security deposit and first month's rent to proceed with move-in. Choose your preferred payment method below.
            </p>

            {/* Payment Options */}
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Payment methods available:</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <FaCreditCard className="text-blue-600" /> Razorpay
                </span>
                <span className="flex items-center gap-2">
                  <FaCreditCard className="text-yellow-600" /> PayPal
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  }
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronRight className="rotate-180" /> Back
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaMoneyBillWave /> Proceed to Payment
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && step === 4 && booking && contract && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            appointment={{
              ...booking,
              contractId: contract._id,
              isRentalPayment: true,
              securityDeposit: contract.securityDeposit || (listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0) * (listing?.securityDepositMonths || 2),
              firstMonthRent: contract.lockedRentAmount || listing?.monthlyRent || listing?.discountPrice || listing?.regularPrice || 0
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* Step 5: Move-in */}
        {step === 5 && contract && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaHome /> Move-in Checklist
            </h2>
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                Complete your move-in checklist to document the property condition. This will help protect you during move-out.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">What to do:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Upload photos/videos of each room</li>
                  <li>Document existing damages or issues</li>
                  <li>Note amenities and their condition</li>
                  <li>Add any special notes for the landlord</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  }
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronLeft /> Back
              </button>
              <button
                onClick={() => {
                  const contractId = contract.contractId || contract._id;
                  navigate(`/user/services?contractId=${contractId}&checklist=move_in`);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaCheckCircle /> Complete Move-in Checklist
              </button>
              <button
                onClick={() => {
                  toast.success("Booking complete! You can complete the checklist later from your appointments.");
                  navigate("/user/my-appointments");
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

