import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaDownload, FaArrowLeft, FaFilePdf, FaImage, FaFileAlt } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ViewDocument() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fileType, setFileType] = useState(null);
    const { currentUser } = useSelector((state) => state.user);

    const docType = document?.type?.replace(/_/g, ' ') || 'Document';
    usePageTitle(`${docType.charAt(0).toUpperCase() + docType.slice(1)} - UrbanSetu`);

    const isPublic = location.pathname.startsWith('/view/');

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const endpoint = isPublic
                    ? `${API_BASE_URL}/api/rental/public/documents/${documentId}`
                    : `${API_BASE_URL}/api/rental/loans/documents/${documentId}`;

                const res = await fetch(endpoint, {
                    credentials: isPublic ? 'omit' : 'include'
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    setDocument(data.document);

                    // Use backend-provided MIME type if available
                    if (data.document.mimeType) {
                        if (data.document.mimeType.includes('pdf')) {
                            setFileType('pdf');
                        } else if (data.document.mimeType.includes('image')) {
                            setFileType('image');
                        } else {
                            // Backend determined valid type, but not PDF/Image (e.g. DOCX)
                            setFileType('other');
                        }
                    } else {
                        // Fallback checking
                        await determineFileType(data.document.url);
                    }
                } else {
                    setError(data.message || 'Failed to fetch document');
                }
            } catch (err) {
                console.error('Error fetching document:', err);
                setError('Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        if (documentId) {
            fetchDocument();
        }
    }, [documentId]);

    const determineFileType = async (url) => {
        if (!url) return;

        // 1. Try to guess from extension first (quickest)
        const extension = getFileExtension(url);
        if (extension) {
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
                setFileType('image');
                return;
            }
            if (extension === 'pdf') {
                setFileType('pdf');
                return;
            }
        }

        // 2. If extension is missing or unknown, check Content-Type header
        try {
            // Try HEAD first
            let response = await fetch(url, { method: 'HEAD' });

            // If HEAD fails (e.g., 405 Method Not Allowed), try GET with AbortController
            if (!response.ok) {
                const controller = new AbortController();
                response = await fetch(url, { signal: controller.signal });
                controller.abort(); // Cancel immediately after headers
            }

            const contentType = response.headers.get('content-type');

            if (contentType) {
                if (contentType.includes('application/pdf')) {
                    setFileType('pdf');
                } else if (contentType.includes('image/')) {
                    setFileType('image');
                } else if (contentType.includes('application/octet-stream') && url.includes('/raw/')) {
                    // Cloudinary raw files often return octet-stream but users typically upload PDFs here
                    // Assume PDF for preview attempts
                    setFileType('pdf');
                } else {
                    setFileType('other');
                }
            } else {
                setFileType('other');
            }
        } catch (error) {
            console.warn('Could not determine file type from headers:', error);
            // Fallback: Check if Cloudinary raw but might be PDF...
            if (url.includes('/raw/') || url.includes('cloudinary.com')) {
                // Assume PDF as best effort for raw/unknown Cloudinary links
                setFileType('pdf');
            } else {
                setFileType('other');
            }
        }
    };

    const handleDownloadDocument = async (docUrl, docName, providedMimeType) => {
        try {
            if (!docUrl) return;

            const response = await fetch(docUrl, { mode: 'cors' });
            if (!response.ok) throw new Error('Failed to fetch document');

            const contentType = response.headers.get('content-type') || providedMimeType || '';

            // Determine default extension based on provided mime type if available
            let extension = 'pdf';
            if (providedMimeType) {
                if (providedMimeType.includes('image')) extension = 'jpg';
                else if (providedMimeType.includes('pdf')) extension = 'pdf';
            }

            try {
                const urlPath = docUrl.split('?')[0];
                const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                if (lastSegment.includes('.')) {
                    extension = lastSegment.split('.').pop();
                }
            } catch (e) {
                console.warn('URL parsing failed', e);
            }

            const mimeMap = {
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'text/plain': 'txt'
            };

            // If we have a valid content-type header (not generic), use it to correct the extension
            if (contentType && !contentType.includes('octet-stream') && mimeMap[contentType.toLowerCase()]) {
                extension = mimeMap[contentType.toLowerCase()];
            }
            // If header is generic/missing but we have providedMimeType, use that
            else if (providedMimeType && mimeMap[providedMimeType.toLowerCase()]) {
                extension = mimeMap[providedMimeType.toLowerCase()];
            }

            const filename = `${docName || 'document'}-${new Date().getTime()}.${extension}`;
            const blob = await response.blob();

            // Force PDF type if we think it is a PDF but served as octet-stream
            const finalBlob = (extension === 'pdf' && contentType.includes('octet-stream'))
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
            // Fallback
            window.open(docUrl, '_blank');
        }
    };

    const getFileExtension = (url) => {
        if (!url) return '';
        try {
            const urlPath = url.split('?')[0];
            // Fix: Check if there is even a dot in the filename part
            const lastSlashIndex = urlPath.lastIndexOf('/');
            const filename = urlPath.substring(lastSlashIndex + 1);

            if (filename.includes('.')) {
                return filename.split('.').pop().toLowerCase();
            }
            return '';
        } catch (e) {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaFileAlt className="text-2xl text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Document</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!document) return null;

    const isImage = fileType === 'image';
    const isPdf = fileType === 'pdf';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800 capitalize">
                        {document.type?.replace(/_/g, ' ') || 'Document View'}
                    </h1>
                </div>
                {isPublic ? (
                    <button
                        onClick={() => navigate('/sign-in')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <span className="hidden sm:inline">Sign in to Download</span>
                        <span className="sm:hidden">Sign in</span>
                    </button>
                ) : (
                    <button
                        onClick={() => handleDownloadDocument(document.url, document.type, document.mimeType)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FaDownload />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-6xl h-[80vh] flex items-center justify-center relative">
                    {isPdf ? (
                        <iframe
                            src={document.url}
                            className="w-full h-full"
                            title="Document Viewer"
                        />
                    ) : isImage ? (
                        <img
                            src={document.url}
                            alt="Document"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaFileAlt className="text-4xl text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Preview Not Available</h3>
                            <p className="text-gray-600 mb-6">This file type cannot be previewed directly.</p>
                            {isPublic ? (
                                <button
                                    onClick={() => navigate('/sign-in')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Sign in to Download
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleDownloadDocument(document.url, document.type, document.mimeType)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FaDownload /> Download to View
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
