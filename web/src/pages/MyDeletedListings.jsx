import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaTrash, FaUndo, FaSearch, FaUser, FaUserShield, FaCalendarAlt, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import MyDeletedListingsSkeleton from "../components/skeletons/MyDeletedListingsSkeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MyDeletedListings() {
    const { currentUser } = useSelector((state) => state.user);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
    });

    const [restoringId, setRestoringId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedListingToRestore, setSelectedListingToRestore] = useState(null);

    useEffect(() => {
        if (currentUser) {
            fetchDeletedListings();
        }
    }, [currentUser, filters]);

    const fetchDeletedListings = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
            queryParams.append('limit', '50');

            const res = await fetch(`${API_BASE_URL}/api/listing/user/get-deleted?${queryParams.toString()}`, {
                credentials: 'include'
            });

            const data = await res.json();

            if (data.success) {
                setListings(data.data);
            } else {
                setError(data.message || 'Failed to fetch deleted listings');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = (listing) => {
        setSelectedListingToRestore(listing);
        setShowConfirmModal(true);
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <FaTrash className="text-red-500" />
                            My Deleted Listings
                        </h1>
                        <p className="text-gray-600 mt-1">View and restore your deleted properties</p>
                    </div>
                    <Link
                        to="/user/my-listings"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2"
                    >
                        <FaArrowLeft /> Back to My Listings
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by property name or address..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <MyDeletedListingsSkeleton />
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-xl text-center">
                        <FaExclamationTriangle className="mx-auto text-4xl mb-4 opacity-50" />
                        <p className="text-lg font-medium">{error}</p>
                        <button
                            onClick={fetchDeletedListings}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Deleted Listings Found</h3>
                        <p className="text-gray-500">You don't have any deleted listings.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restoration</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {listings.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                        {item.listingData.imageUrls?.[0] ? (
                                                            <img
                                                                src={item.listingData.imageUrls[0]}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <FaCalendarAlt />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={`/listing/${item.originalListingId}`}
                                                            target="_blank"
                                                            className="font-semibold text-gray-900 truncate max-w-[200px] hover:text-blue-600 hover:underline block"
                                                            title={item.listingData.name}
                                                        >
                                                            {item.listingData.name}
                                                        </Link>
                                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                            {item.listingData.address}
                                                        </div>
                                                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                                                            {item.listingData.type === 'rent' ? 'For Rent' : 'For Sale'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-semibold ${item.deletionType === 'admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {item.deletionType === 'admin' ? <FaUserShield className="text-[10px]" /> : <FaUser className="text-[10px]" />}
                                                        {item.deletionType === 'admin' ? 'Deleted by Admin' : 'Deleted by You'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(item.deletedAt)}
                                                    </span>
                                                    {item.deletionReason && (
                                                        <div className="text-xs bg-gray-100 p-1 rounded mt-1 text-gray-600 max-w-[200px] truncate" title={item.deletionReason}>
                                                            Reason: {item.deletionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.tokenExpiry && (!item.deletionType || item.deletionType === 'owner') ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-xs font-medium ${getDaysRemaining(item.tokenExpiry) < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {getDaysRemaining(item.tokenExpiry)} days remaining
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            Expires: {new Date(item.tokenExpiry).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {item.deletionType === 'admin' ? 'Contact Admin to Restore' : 'Cannot Auto-Restore'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(item.deletionType !== 'admin' || !item.deletionType) && (
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
                                                )}
                                                {item.deletionType === 'admin' && (
                                                    <button
                                                        disabled
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium"
                                                        title="Only admins can restore properties they deleted"
                                                    >
                                                        <FaUserShield /> Admin Action Required
                                                    </button>
                                                )}
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
                                This will make the property active again on the platform.
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
