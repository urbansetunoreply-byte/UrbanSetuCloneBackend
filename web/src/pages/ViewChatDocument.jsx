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
            const ext = url.split('.').pop().toLowerCase();

            if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) derivedType = 'image';
            else if (type === 'pdf' || ext === 'pdf') derivedType = 'pdf';
            else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) {
                derivedType = 'office';
            }

            setFileType(derivedType);

            // Fetch blob for PDF or generic 'other' types (like txt, etc) to prevent immediate auto-download
            // Office docs use Google Viewer so they don't need this pre-fetch
            if (derivedType === 'pdf' || derivedType === 'other') {
                setLoading(true);
                fetch(url, { mode: 'cors' })
                    .then(r => r.blob())
                    .then(blob => {
                        const blobType = derivedType === 'pdf' ? 'application/pdf' : blob.type;
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

            // Optimization: Use locally fetched blob if available
            if (pdfBlobUrl) {
                const filename = docName || `document-${Date.now()}`;
                const link = window.document.createElement('a');
                link.href = pdfBlobUrl;
                link.download = filename;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                return;
            }

            // For other files, direct open/download
            window.open(docUrl, '_blank');

        } catch (error) {
            console.error('Error downloading document:', error);
            alert("Download failed. Please try again or contact support.");
        }
    };

    // Access Control
    const accessParams = new URLSearchParams(location.search);
    const participantsStr = accessParams.get('participants');
    const participants = participantsStr ? decodeURIComponent(participantsStr).split(',') : [];

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin');
    const isParticipant = currentUser && participants.includes(currentUser.email);
    // Allow if admin, or if user is a valid participant. 
    // Strict Mode: If not admin, require participant match.
    const isAuthorized = isAdmin || isParticipant;

    if (!currentUser || !isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaLock className="text-2xl text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Restricted Access</h2>
                    <p className="text-gray-600 mb-6">
                        {!currentUser
                            ? "You must be signed in to view this document."
                            : "You are not authorized to view this document."}
                    </p>
                    <button
                        onClick={() => navigate(currentUser ? -1 : '/sign-in')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {currentUser ? "Go Back" : "Sign In"}
                    </button>
                </div>
            </div>
        );
    }

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
                <button
                    onClick={() => handleDownloadDocument(document.url, document.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FaDownload />
                    <span className="hidden sm:inline">Download</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-auto">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-6xl h-[80vh] flex items-center justify-center relative">
                    {isImage ? (
                        <img
                            src={document.url}
                            alt="Document"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (isPdf || fileType === 'other') && !pdfBlobUrl ? (
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
                    ) : (
                        <iframe
                            src={pdfBlobUrl || document.url}
                            className="w-full h-full"
                            title="Document Viewer"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
