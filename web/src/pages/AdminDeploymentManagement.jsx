import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { FaUpload, FaTrash, FaDownload, FaCheck, FaTimes, FaMobile, FaDesktop, FaApple, FaAndroid, FaWindows, FaSpinner, FaCloudUploadAlt, FaHistory, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
import { resetAndroidDownloadCache } from '../utils/androidDownload';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDeploymentManagement() {
  // Set page title
  usePageTitle("Deployment Management - App Updates");

  const { currentUser } = useSelector((state) => state.user);

  const [files, setFiles] = useState([]);
  const [activeFiles, setActiveFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadXhr, setUploadXhr] = useState(null);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadXhr) {
        uploadXhr.abort();
      }
    };
  }, [uploadXhr]);

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

    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files[0]) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('platform', uploadData.platform);
      formData.append('version', uploadData.version);
      formData.append('description', uploadData.description);
      formData.append('isActive', uploadData.isActive);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      setUploadXhr(xhr);
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              toast.success('File uploaded successfully to AWS S3!');
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
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            toast.error('Upload failed - invalid response');
          }
        } else {
          toast.error(`Upload failed with status: ${xhr.status}`);
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadXhr(null);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Upload error:', xhr.statusText);
        toast.error('Upload failed - network error');
        setUploading(false);
        setUploadProgress(0);
        setUploadXhr(null);
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        console.log('Upload aborted');
        toast.error('Upload cancelled');
        setUploading(false);
        setUploadProgress(0);
        setUploadXhr(null);
      });

      // Start upload
      xhr.open('POST', `${API_BASE_URL}/api/deployment/upload`);
      xhr.withCredentials = true; // Include credentials for cookies
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setUploading(false);
      setUploadProgress(0);
      setUploadXhr(null);
    }
  };

  const handleCancelUpload = () => {
    if (uploadXhr) {
      uploadXhr.abort();
    }
  };

  const handleSetActive = async (fileId) => {
    try {
      const encodedId = encodeURIComponent(fileId);
      const response = await fetch(`${API_BASE_URL}/api/deployment/set-active/${encodedId}`, {
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
      // Invalidate public download cache immediately after changes
      resetAndroidDownloadCache();
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
      const encodedId = encodeURIComponent(fileId);
      const response = await fetch(`${API_BASE_URL}/api/deployment/${encodedId}`, {
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
      // Invalidate public download cache immediately after changes
      resetAndroidDownloadCache();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownloadFile = async (fileId) => {
    try {
      const encodedId = encodeURIComponent(fileId);
      const res = await fetch(`${API_BASE_URL}/api/deployment/download-url?id=${encodedId}`, { credentials: 'include' });
      const data = await res.json();
      if (data && data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || 'Failed to get download link');
      }
    } catch (err) {
      toast.error('Failed to get download link');
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

  // Client-side guard: only rootadmin can access
  if (currentUser && currentUser.role !== 'rootadmin') {
    return <Navigate to="/admin" replace />;
  }

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
            Deployment Management (AWS S3)
          </h1>
          <p className="text-gray-600 mt-2">Manage mobile app deployments and updates - Supports files up to 200MB</p>
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

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadProgress < 100 ? 'Uploading file...' : 'Processing upload...'}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload File
                  </>
                )}
              </button>
              
              {uploading && (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
                >
                  <FaTimes />
                  Cancel
                </button>
              )}
            </div>
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
                    <button
                      onClick={() => handleDownloadFile(file.id)}
                      className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <FaDownload />
                      Download
                    </button>
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
                          <button
                            onClick={() => handleDownloadFile(file.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Download"
                          >
                            <FaDownload />
                          </button>
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
