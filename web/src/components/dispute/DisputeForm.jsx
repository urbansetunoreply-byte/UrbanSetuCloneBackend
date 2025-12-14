import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUpload, FaTimes, FaSpinner, FaImage, FaVideo, FaFile, FaPaperclip, FaDownload } from 'react-icons/fa';
import ImagePreview from '../ImagePreview';
import VideoPreview from '../VideoPreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DISPUTE_CATEGORIES = [
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'property_maintenance', label: 'Property Maintenance' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'contract_violation', label: 'Contract Violation' },
  { value: 'damage_assessment', label: 'Damage Assessment' },
  { value: 'early_termination', label: 'Early Termination' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium', default: true },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default function DisputeForm({ contract, onSuccess, onCancel }) {
  const { currentUser } = useSelector((state) => state.user);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [formData, setFormData] = useState({
    contractId: contract?._id || '',
    category: 'other',
    title: '',
    description: '',
    priority: 'medium',
    evidence: []
  });

  useEffect(() => {
    if (!contract) {
      fetchContracts();
    } else {
      setFormData(prev => ({ ...prev, contractId: contract._id }));
    }
  }, [contract]);

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts?status=active`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDownloadDocument = async (docUrl, docName) => {
    try {
      if (!docUrl) return;

      const response = await fetch(docUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch document');

      const contentType = response.headers.get('content-type') || '';
      let extension = 'pdf';

      try {
        const urlPath = docUrl.split('?')[0];
        const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
        if (lastSegment.includes('.')) {
          extension = lastSegment.split('.').pop();
        }
      } catch (e) {
        console.warn('URL parsing failed', e);
      }

      if ((!extension || extension === 'file') && contentType && !contentType.includes('octet-stream')) {
        const mimeMap = {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'text/plain': 'txt'
        };
        extension = mimeMap[contentType.toLowerCase()] || 'pdf';
      }

      const filename = `${docName || 'document'}-${new Date().getTime()}.${extension}`;
      const blob = await response.blob();

      const finalBlob = extension === 'pdf' && contentType.includes('octet-stream')
        ? new Blob([blob], { type: 'application/pdf' })
        : blob;

      const blobUrl = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Error downloading document:', error);
      window.open(docUrl, '_blank');
    }
  };

  const handleEvidenceUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(type);
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
          url: data.imageUrl || data.videoUrl || data.documentUrl || data.url,
          description: '',
          uploadedAt: new Date(),
          uploadedBy: currentUser._id
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...uploaded]
      }));
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contractId) {
      toast.error('Please select a contract');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a dispute title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a dispute description');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${formData.contractId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          evidence: formData.evidence
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Dispute created successfully');
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contract Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rental Contract <span className="text-red-500">*</span>
        </label>
        {contract ? (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold">{contract.listingId?.name || 'Property'}</div>
            <div className="text-sm text-gray-600">Contract ID: {contract.contractId}</div>
          </div>
        ) : (
          <select
            name="contractId"
            value={formData.contractId}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a contract</option>
            {contracts.map(c => (
              <option key={c._id} value={c._id}>
                {c.listingId?.name || 'Property'} - {c.contractId}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {DISPUTE_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="Brief description of the dispute"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={6}
          placeholder="Provide detailed information about the dispute..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Evidence Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Evidence (Optional)
        </label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading === 'image' ? <FaSpinner className="animate-spin" /> : <FaImage />}
            <span className="text-sm font-medium text-blue-700">Upload Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleEvidenceUpload(e, 'image')}
              disabled={!!uploading}
            />
          </label>
          <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading === 'video' ? <FaSpinner className="animate-spin" /> : <FaVideo />}
            <span className="text-sm font-medium text-purple-700">Upload Videos</span>
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleEvidenceUpload(e, 'video')}
              disabled={!!uploading}
            />
          </label>
          <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading === 'document' ? <FaSpinner className="animate-spin" /> : <FaFile />}
            <span className="text-sm font-medium text-green-700">Upload Documents</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              className="hidden"
              onChange={(e) => handleEvidenceUpload(e, 'document')}
              disabled={!!uploading}
            />
          </label>
        </div>

        {/* Evidence Preview */}
        {formData.evidence.length > 0 && (
          <div className="space-y-2">
            {formData.evidence.map((evidence, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  {evidence.type === 'image' && (
                    <div className="w-20 h-20 rounded overflow-hidden bg-gray-200">
                      <img
                        src={evidence.url}
                        alt="Evidence preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {evidence.type === 'video' && (
                    <div className="w-20 h-20 rounded overflow-hidden bg-gray-200">
                      <video
                        src={evidence.url}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {evidence.type === 'document' && (
                    <div className="flex items-center gap-2">
                      <FaFile className="text-blue-600" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">Document</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadDocument(evidence.url, 'evidence');
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline text-left"
                        >
                          <FaDownload className="text-[10px]" /> Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeEvidence(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaPaperclip />}
          {loading ? 'Creating...' : 'Raise Dispute'}
        </button>
      </div>
    </form>
  );
}

