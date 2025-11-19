import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaClock, FaFileAlt, FaComments, FaCheckCircle, FaTimes, FaPaperPlane, FaSpinner, FaUpload, FaImage, FaVideo, FaFile, FaDownload, FaGavel, FaExclamationTriangle } from 'react-icons/fa';
import ImagePreview from '../ImagePreview';
import VideoPreview from '../VideoPreview';
import UserAvatar from '../UserAvatar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function DisputeDetail({ dispute, currentUser, onUpdate, getStatusColor, DISPUTE_CATEGORIES, DISPUTE_STATUS, PRIORITY_COLORS }) {
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const isAdmin = currentUser?.role === 'admin';
  const isRaisedBy = dispute.raisedBy?._id === currentUser?._id || dispute.raisedBy === currentUser?._id;
  const isRaisedAgainst = dispute.raisedAgainst?._id === currentUser?._id || dispute.raisedAgainst === currentUser?._id;
  const canComment = isRaisedBy || isRaisedAgainst || isAdmin;

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${dispute._id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          attachments: attachments.map(a => a.url)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Message sent');
        setNewMessage('');
        setAttachments([]);
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        let endpoint = '/api/upload/image';
        
        if (type === 'image') {
          formData.append('image', file);
        } else if (type === 'video') {
          formData.append('video', file);
          endpoint = '/api/upload/video';
        } else {
          formData.append('document', file);
          endpoint = '/api/upload/document';
        }

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        return {
          type,
          url: data.imageUrl || data.videoUrl || data.documentUrl || data.url
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{dispute.title}</h3>
            <p className="text-sm text-gray-600 font-mono mb-3">{dispute.disputeId}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[dispute.priority] || PRIORITY_COLORS.medium}`}>
                {dispute.priority?.toUpperCase() || 'MEDIUM'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(dispute.status)}`}>
                {DISPUTE_STATUS[dispute.status] || dispute.status}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                {DISPUTE_CATEGORIES[dispute.category] || dispute.category}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 font-medium">Raised by:</span>{' '}
            <span className="text-gray-800">{dispute.raisedBy?.username || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-600 font-medium">Against:</span>{' '}
            <span className="text-gray-800">{dispute.raisedAgainst?.username || 'Unknown'}</span>
          </div>
          {dispute.contractId?.listingId?.name && (
            <div>
              <span className="text-gray-600 font-medium">Property:</span>{' '}
              <span className="text-gray-800">{dispute.contractId.listingId.name}</span>
            </div>
          )}
          <div>
            <span className="text-gray-600 font-medium">Created:</span>{' '}
            <span className="text-gray-800">{new Date(dispute.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{dispute.description}</p>
      </div>

      {/* Evidence */}
      {dispute.evidence && dispute.evidence.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaFileAlt /> Evidence ({dispute.evidence.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dispute.evidence.map((evidence, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                {evidence.type === 'image' && (
                  <div className="aspect-square rounded overflow-hidden mb-2">
                    <ImagePreview imageUrl={evidence.url} />
                  </div>
                )}
                {evidence.type === 'video' && (
                  <div className="aspect-square rounded overflow-hidden mb-2">
                    <VideoPreview videoUrl={evidence.url} />
                  </div>
                )}
                {evidence.type === 'document' && (
                  <div className="aspect-square flex items-center justify-center bg-blue-100 rounded mb-2">
                    <FaFile className="text-4xl text-blue-600" />
                  </div>
                )}
                {evidence.description && (
                  <p className="text-xs text-gray-600">{evidence.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution */}
      {dispute.status === 'resolved' && dispute.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaCheckCircle className="text-green-600" />
            <h4 className="font-semibold text-green-800">Resolution</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Decision:</span> {dispute.resolution.decision || 'N/A'}</div>
            <div><span className="font-medium">Action Taken:</span> {dispute.resolution.actionTaken || 'N/A'}</div>
            {dispute.resolution.amount > 0 && (
              <div><span className="font-medium">Amount:</span> ₹{dispute.resolution.amount.toLocaleString()}</div>
            )}
            {dispute.resolution.notes && (
              <div><span className="font-medium">Notes:</span> {dispute.resolution.notes}</div>
            )}
            {dispute.resolution.resolutionDate && (
              <div><span className="font-medium">Resolved on:</span> {new Date(dispute.resolution.resolutionDate).toLocaleString()}</div>
            )}
            {dispute.resolution.decidedBy && (
              <div><span className="font-medium">Decided by:</span> {dispute.resolution.decidedBy?.username || 'Admin'}</div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaComments /> Messages ({dispute.messages?.length || 0})
        </h4>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {dispute.messages && dispute.messages.length > 0 ? (
            dispute.messages.map((message, index) => {
              const isOwnMessage = message.sender?._id === currentUser?._id || message.sender === currentUser?._id;
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  <UserAvatar
                    user={message.sender}
                    size="md"
                  />
                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      isOwnMessage ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="font-semibold text-sm mb-1">
                        {message.sender?.username || 'Unknown'}
                      </div>
                      <p className="text-sm">{message.message}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <FaFileAlt /> Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">No messages yet</p>
          )}
        </div>

        {/* Message Input */}
        {canComment && dispute.status !== 'resolved' && dispute.status !== 'closed' && (
          <div className="border-t pt-4">
            <div className="mb-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                    {attachment.type === 'image' && <FaImage className="text-blue-600" />}
                    {attachment.type === 'video' && <FaVideo className="text-purple-600" />}
                    {attachment.type === 'document' && <FaFile className="text-green-600" />}
                    <span className="text-xs text-gray-700">File {index + 1}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 text-sm">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaImage />}
                <span className="text-blue-700">Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAttachmentUpload(e, 'image')}
                  disabled={uploading}
                />
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 text-sm">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaVideo />}
                <span className="text-purple-700">Video</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAttachmentUpload(e, 'video')}
                  disabled={uploading}
                />
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 text-sm">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaFile />}
                <span className="text-green-700">Document</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAttachmentUpload(e, 'document')}
                  disabled={uploading}
                />
              </label>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && attachments.length === 0)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

