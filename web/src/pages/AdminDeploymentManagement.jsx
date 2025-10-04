import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaDownload, FaCheck, FaTimes, FaMobile, FaDesktop, FaApple, FaAndroid, FaWindows, FaSpinner, FaCloudUploadAlt, FaHistory, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDeploymentManagement() {
  const [files, setFiles] = useState([]);
  const [activeFiles, setActiveFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    platform: 'android',
    version: '',
    description: '',
    isActive: false
  });

  useEffect(() => {
    fetchFiles();
    fetchActiveFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deployment`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch deployment files');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deployment/active`);
      const data = await response.json();
      if (data.success) {
        setActiveFiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching active files:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.version) {
      toast.error('Please enter a version number');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const fileInput = document.getElementById('fileInput');
      if (!fileInput.files[0]) {
        toast.error('Please select a file');
        setUploading(false);
        return;
      }

      formData.append('file', fileInput.files[0]);
      formData.append('platform', uploadData.platform);
      formData.append('version', uploadData.version);
      formData.append('description', uploadData.description);
      formData.append('isActive', uploadData.isActive);

      const response = await fetch(`${API_BASE_URL}/api/deployment/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('File uploaded successfully!');
        setUploadData({
          platform: 'android',
          version: '',
          description: '',
          isActive: false
        });
        document.getElementById('fileInput').value = '';
        fetchFiles();
        fetchActiveFiles();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deployment/set-active/${fileId}`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Active deployment updated!');
        fetchFiles();
        fetchActiveFiles();
      } else {
        toast.error(data.message || 'Failed to set active deployment');
      }
    } catch (error) {
      console.error('Error setting active:', error);
      toast.error('Failed to set active deployment');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/deployment/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('File deleted successfully!');
        fetchFiles();
        fetchActiveFiles();
      } else {
        toast.error(data.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android': return <FaAndroid className="text-green-500" />;
      case 'ios': return <FaApple className="text-gray-600" />;
      case 'windows': return <FaWindows className="text-blue-500" />;
      case 'macos': return <FaApple className="text-gray-800" />;
      default: return <FaMobile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading deployment management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaCloudUploadAlt className="text-blue-600" />
            Deployment Management
          </h1>
          <p className="text-gray-600 mt-2">Manage mobile app deployments and updates</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaUpload className="text-green-600" />
            Upload New Deployment
          </h2>
          
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={uploadData.platform}
                  onChange={(e) => setUploadData({...uploadData, platform: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="android">Android (APK)</option>
                  <option value="ios">iOS (IPA)</option>
                  <option value="windows">Windows (EXE/MSI)</option>
                  <option value="macos">macOS (DMG/PKG)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={uploadData.version}
                  onChange={(e) => setUploadData({...uploadData, version: e.target.value})}
                  placeholder="e.g., 1.0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                placeholder="Describe this deployment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={uploadData.isActive}
                  onChange={(e) => setUploadData({...uploadData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Set as active deployment</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".apk,.ipa,.exe,.msi,.dmg,.pkg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload />
                  Upload File
                </>
              )}
            </button>
          </form>
        </div>

        {/* Active Deployments */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaCheck className="text-green-600" />
            Active Deployments
          </h2>
          
          {activeFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active deployments</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeFiles.map((file) => (
                <div key={file.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(file.platform)}
                      <span className="font-medium text-gray-900">{file.platform.toUpperCase()}</span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ACTIVE</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Version: {file.version}</p>
                  <p className="text-xs text-gray-500 mb-3">{formatFileSize(file.size)}</p>
                  <div className="flex gap-2">
                    <a
                      href={file.url}
                      download
                      className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <FaDownload />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Files */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaHistory className="text-gray-600" />
            All Deployments
          </h2>
          
          {files.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No deployments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(file.platform)}
                          <span className="text-sm font-medium text-gray-900">{file.platform.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.version}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.size)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {file.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheck className="mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FaTimes className="mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(file.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <a
                            href={file.url}
                            download
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Download"
                          >
                            <FaDownload />
                          </a>
                          {!file.isActive && (
                            <button
                              onClick={() => handleSetActive(file.id)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Set as Active"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
