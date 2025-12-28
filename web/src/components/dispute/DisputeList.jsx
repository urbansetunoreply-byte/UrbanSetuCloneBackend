import React from 'react';
import { FaExclamationTriangle, FaUser, FaClock, FaFileAlt, FaComments, FaCheckCircle, FaGavel } from 'react-icons/fa';

export default function DisputeList({ disputes, onViewDispute, getStatusColor, DISPUTE_CATEGORIES, DISPUTE_STATUS, PRIORITY_COLORS }) {
  if (disputes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
        <FaExclamationTriangle className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Disputes Found</h3>
        <p className="text-gray-500 dark:text-gray-400">No disputes match your current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => {
        const unreadCount = dispute.messages?.filter(msg =>
          !msg.readBy?.includes(dispute.raisedBy?._id || dispute.raisedBy)
        ).length || 0;

        return (
          <div
            key={dispute._id}
            onClick={() => onViewDispute(dispute)}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 ${getStatusColor(dispute.status)} cursor-pointer hover:shadow-xl transition-all`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                      {dispute.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-2">
                      {dispute.disputeId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Type Badge */}
                    {dispute.contractId ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        RENTAL
                      </span>
                    ) : dispute.bookingId ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        SALE
                      </span>
                    ) : null}

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[dispute.priority] || PRIORITY_COLORS.medium}`}>
                      {dispute.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(dispute.status)}`}>
                      {DISPUTE_STATUS[dispute.status] || dispute.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaFileAlt className="text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                    <span>{DISPUTE_CATEGORIES[dispute.category] || dispute.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaUser className="text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Raised by:</span>
                    <span className="text-gray-800 dark:text-gray-200">{dispute.raisedBy?.username || 'Unknown'}</span>
                    <span className="text-gray-400">against</span>
                    <span className="text-gray-800 dark:text-gray-200">{dispute.raisedAgainst?.username || 'Unknown'}</span>
                  </div>
                  {(dispute.contractId?.listingId?.name || dispute.bookingId?.listingId?.name) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaGavel className="text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Property:</span>
                      <span>{dispute.contractId?.listingId?.name || dispute.bookingId?.listingId?.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaClock className="text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                    <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                  {dispute.description}
                </p>

                {/* Evidence Count */}
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <FaFileAlt className="text-blue-600 dark:text-blue-400" />
                    <span>{dispute.evidence.length} evidence file(s) attached</span>
                  </div>
                )}

                {/* Messages Count */}
                {dispute.messages && dispute.messages.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaComments className="text-green-600 dark:text-green-400" />
                    <span>{dispute.messages.length} message(s)</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Status */}
              {dispute.status === 'resolved' && dispute.resolution && (
                <div className="md:w-64 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCheckCircle className="text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-300">Resolved</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div><span className="font-medium">Action:</span> {dispute.resolution.actionTaken || 'N/A'}</div>
                    {dispute.resolution.amount > 0 && (
                      <div><span className="font-medium">Amount:</span> ₹{dispute.resolution.amount.toLocaleString()}</div>
                    )}
                    {dispute.resolution.resolutionDate && (
                      <div><span className="font-medium">Date:</span> {new Date(dispute.resolution.resolutionDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

