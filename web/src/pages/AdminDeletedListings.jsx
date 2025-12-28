import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaUndo, FaSearch, FaFilter, FaUser, FaUserShield, FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify"; // Using toast directly if ToastContainer is at App level
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import AdminDeletedListingsSkeleton from "../components/skeletons/AdminDeletedListingsSkeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDeletedListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        searchTerm: '',
        deletionType: 'all',
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedListingToRestore, setSelectedListingToRestore] = useState(null);

    useEffect(() => {
        fetchDeletedListings();
    }, [filters]);

    // ... existing fetchDeletedListings ... 

    // Function to open modal
    const handleRestoreClick = (listing) => {
        setSelectedListingToRestore(listing);
        setShowConfirmModal(true);
    };

    // Actual restore function called from modal
    const confirmRestore = async () => {
        if (!selectedListingToRestore) return;

        const id = selectedListingToRestore._id;

        try {
            setRestoringId(id);
            const res = await fetch(`${API_BASE_URL}/api/listing/restore-deleted/${id}`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Listing restored successfully!");
                // Remove from list
                setListings(prev => prev.filter(item => item._id !== id));
                setShowConfirmModal(false);
            } else {
                toast.error(data.message || "Failed to restore listing");
            }
        } catch (err) {
            toast.error("An error occurred while restoring");
        } finally {
            setRestoringId(null);
            setShowConfirmModal(false);
            setSelectedListingToRestore(null);
        }
    };

    // ... existing formatDate, getDaysRemaining ...

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {/* ... existing header and filters ... */}

                {/* Content */}
                {loading ? (
                    <AdminDeletedListingsSkeleton />
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-xl text-center">
                        {/* ... existing error view ... */}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        {/* ... existing empty view ... */}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                {/* ... existing thead ... */}
                                <tbody className="divide-y divide-gray-100">
                                    {listings.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            {/* ... existing columns ... */}

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRestoreClick(item)}
                                                    disabled={restoringId === item._id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                >
                                                    {restoringId === item._id ? (
                                                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                                    ) : (
                                                        <FaUndo />
                                                    )}
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Restore Confirmation Modal */}
            {showConfirmModal && selectedListingToRestore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                        <div className="p-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaUndo className="text-green-600 text-2xl" />
                            </div>

                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                                Restore Property?
                            </h3>

                            <p className="text-center text-gray-500 mb-6">
                                You are about to restore <strong>{selectedListingToRestore.listingData.name}</strong>.
                                <br /><br />
                                This will make the property active again on the platform and notify the owner via email.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRestore}
                                    disabled={restoringId !== null}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex justify-center items-center gap-2"
                                >
                                    {restoringId !== null ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>Restore Property</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ContactSupportWrapper />
        </div>
    );
}

