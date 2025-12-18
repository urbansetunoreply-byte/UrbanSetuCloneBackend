import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaDownload, FaArrowLeft, FaFilePdf, FaImage, FaFileAlt, FaLock } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ViewChatDocument() {
    const { documentId } = useParams(); // May not be used if we rely purely on query params for separate viewer
    const navigate = useNavigate();
    const location = useLocation();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fileType, setFileType] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const { currentUser } = useSelector((state) => state.user);

    const docType = document?.type?.replace(/_/g, ' ') || 'Document';
    usePageTitle(`${docType.charAt(0).toUpperCase() + docType.slice(1)} - UrbanSetu`);

    const isPublic = location.pathname.startsWith('/view/');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const url = params.get('url');
        const typeRaw = params.get('type') || 'document';
        const type = typeRaw.toLowerCase();
        let name = params.get('name') || 'Document Preview';

        // Normalize extension to lowercase for display consistency
        if (name && name.includes('.')) {
            const lastDotIndex = name.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                name = name.substring(0, lastDotIndex) + name.substring(lastDotIndex).toLowerCase();
            }
        }

        if (url) {
            setDocument({
                url,
                type,
                mimeType: type === 'document' || url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                name
            });

            let derivedType = 'other';
            // Fix: Handle URLs with query params (e.g., signed URLs)
            const cleanUrl = url.split('?')[0];
            const ext = cleanUrl.split('.').pop().toLowerCase();

            if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) derivedType = 'image';
            else if (type === 'pdf' || ext === 'pdf') derivedType = 'pdf';
            else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) {
                derivedType = 'office';
            } else if (['txt', 'json', 'xml', 'md'].includes(ext)) {
                derivedType = 'text';
            } else {
                derivedType = 'unsupported';
            }

            setFileType(derivedType);

            // Fetch blob for PDF or Text to view safely
            if (derivedType === 'pdf' || derivedType === 'text') {
                setLoading(true);
                fetch(url, { mode: 'cors' })
                    .then(r => r.blob())
                    .then(blob => {
                        // Force correct MIME type for PDF, otherwise trust blob for text
                        const blobType = derivedType === 'pdf' ? 'application/pdf' : (blob.type || 'text/plain');
                        const cleanBlob = new Blob([blob], { type: blobType });
                        setPdfBlobUrl(URL.createObjectURL(cleanBlob));
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Preview blob fetch failed", err);
                        setLoading(false);
                    });
            } else {
                setLoading(false);
            }
        } else {
            setError("No URL provided for preview");
            setLoading(false);
        }

        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [location.search]);

    const handleDownloadDocument = async (docUrl, docName) => {
        try {
            if (!docUrl) return;

            // Ensure filename has extension
            let filename = docName || `document-${Date.now()}`;
            const ext = docUrl.split('.').pop().toLowerCase();
            if (ext && !filename.toLowerCase().endsWith(`.${ext}`)) {
                filename = `${filename}.${ext}`;
            }

            // Optimization: Use locally fetched blob if available
            if (pdfBlobUrl) {
                const link = window.document.createElement('a');
                link.href = pdfBlobUrl;
                link.download = filename;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                return;
            }

            // For other files, direct open/download
            // Use fetch to trigger download to avoid browser opening it in tab if possible
            // But simple window.open is often enough. For robustness we can create a temp link.
            // For other files, direct open/download
            // Use window.open which is more robust for cross-origin downloads (Cloudinary etc.)
            window.open(docUrl, '_blank');

        } catch (error) {
            console.error('Error downloading document:', error);
            alert("Download failed. Please try again or contact support.");
        }
    };

    // Access Control
    const accessParams = new URLSearchParams(location.search);
    const participantsStr = accessParams.get('participants');
    // Fix: Normalize emails (trim + lowercase)
    const participants = participantsStr
        ? decodeURIComponent(participantsStr).split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
        : [];

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin');
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const isParticipant = currentUser && participants.includes(userEmail);
    const isAuthorized = isAdmin || isParticipant;
    const isRestricted = !currentUser || !isAuthorized;
    // We do NOT return early anymore, we render the layout with restricted content.

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-100">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
                <p className="text-gray-600 font-medium">Loading document...</p>
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
                    <h1 className="text-xl font-semibold text-gray-800">
                        {document.name || 'Document View'}
                    </h1>
                </div>
                {isRestricted ? (
                    <button
                        onClick={() => navigate('/sign-in')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <span className="hidden sm:inline">Sign in to Download</span>
                        <span className="sm:hidden">Sign in</span>
                    </button>
                ) : (
                    <button
                        onClick={() => handleDownloadDocument(document.url, document.name)}
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
                    {isRestricted ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 w-full h-full">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <FaLock className="text-2xl text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Restricted Access</h2>
                            <p className="text-gray-600 mb-6 max-w-md">
                                {!currentUser
                                    ? "This document is private. Please sign in to view and download."
                                    : "You are not authorized to view or download this document."}
                            </p>
                            <button
                                onClick={() => navigate(currentUser ? -1 : '/sign-in')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {currentUser ? "Go Back" : "Sign In"}
                            </button>
                        </div>
                    ) : isImage ? (
                        <img
                            src={document.url}
                            alt="Document"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (isPdf || fileType === 'text') && !pdfBlobUrl ? (
                        <div className="flex flex-col items-center justify-center">
                            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                            <p className="text-gray-600">Loading Document...</p>
                        </div>
                    ) : fileType === 'office' ? (
                        <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(document.url)}&embedded=true`}
                            className="w-full h-full"
                            title="Office Document Viewer"
                        />
                    ) : (isPdf || fileType === 'text') && pdfBlobUrl ? (
                        <iframe
                            src={pdfBlobUrl}
                            className="w-full h-full"
                            title="Document Viewer"
                        />
                    ) : (
                        /* Unsupported types - Show placeholder */
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FaFileAlt className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Preview Not Available</h3>
                            <p className="text-gray-500 max-w-md mb-6">
                                This file type cannot be previewed in the browser. Please download the file to view it.
                            </p>
                            <button
                                onClick={() => handleDownloadDocument(document.url, document.name)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <FaDownload /> Download File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
