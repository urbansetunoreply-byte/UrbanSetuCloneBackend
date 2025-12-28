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

    const [restoringId, setRestoringId] = useState(null);

    useEffect(() => {
        fetchDeletedListings();
    }, [filters]);

    const fetchDeletedListings = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
            if (filters.deletionType !== 'all') queryParams.append('deletionType', filters.deletionType);
            queryParams.append('limit', '50'); // Reasonable limit

            const res = await fetch(`${API_BASE_URL}/api/listing/get-deleted?${queryParams.toString()}`, {
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

    const handleRestore = async (id) => {
        if (!window.confirm("Are you sure you want to restore this property? This will make it active again and notify the owner.")) return;

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
            } else {
                toast.error(data.message || "Failed to restore listing");
            }
        } catch (err) {
            toast.error("An error occurred while restoring");
        } finally {
            setRestoringId(null);
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

    // Calculate days remaining for restoration token
    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <FaTrash className="text-red-500" />
                            Deleted Listings Log
                        </h1>
                        <p className="text-gray-600 mt-1">Manage and restore deleted properties</p>
                    </div>
                    <Link
                        to="/admin/listings"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                        ← Back to All Listings
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by property name, owner, or address..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={filters.deletionType}
                                onChange={(e) => setFilters(prev => ({ ...prev, deletionType: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Deletions</option>
                                <option value="owner">Deleted by Owner</option>
                                <option value="admin">Deleted by Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <AdminDeletedListingsSkeleton />
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
                        <p className="text-gray-500">There are no deleted properties matching your filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
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
                                                        <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={item.listingData.name}>
                                                            {item.listingData.name}
                                                        </div>
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
                                                        {item.deletionType === 'admin' ? 'Deleted by Admin' : 'Deleted by Owner'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(item.deletedAt)}
                                                    </span>
                                                    {item.deletionType === 'admin' && (
                                                        <div className="text-xs text-gray-600 mt-1 italic">
                                                            By: {item.deletedBy?.username || 'Unknown Admin'}
                                                        </div>
                                                    )}
                                                    {item.deletionReason && (
                                                        <div className="text-xs bg-gray-100 p-1 rounded mt-1 text-gray-600 max-w-[200px] truncate" title={item.deletionReason}>
                                                            Reason: {item.deletionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                        <img
                                                            src={item.userRef?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{item.userRef?.username || 'Unknown'}</span>
                                                        <span className="text-xs text-gray-500">{item.userRef?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.deletionType === 'owner' && item.tokenExpiry ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-xs font-medium ${getDaysRemaining(item.tokenExpiry) < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {getDaysRemaining(item.tokenExpiry)} days remaining
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            Expires: {new Date(item.tokenExpiry).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No user token</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRestore(item._id)}
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
            <ContactSupportWrapper />
        </div>
    );
}

