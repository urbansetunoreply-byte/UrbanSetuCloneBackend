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

    usePageTitle(`Document Viewer - UrbanSetu`);

    const isPublic = location.pathname.startsWith('/view/');

    useEffect(() => {
        // Chat documents are primarily viewed via "preview" mode with query params
        const params = new URLSearchParams(location.search);
        const url = params.get('url');
        const type = params.get('type') || 'document';
        const name = params.get('name') || 'Document Preview';

        if (url) {
            setDocument({
                url,
                type,
                mimeType: type === 'document' || url.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                name
            });

            let derivedType = 'other';
            if (type === 'image') derivedType = 'image';
            else if (type === 'pdf' || url.endsWith('.pdf')) derivedType = 'pdf';
            else {
                const ext = url.split('.').pop().toLowerCase();
                if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) {
                    derivedType = 'office';
                }
            }

            setFileType(derivedType);

            if (derivedType === 'pdf') {
                fetch(url, { mode: 'cors' })
                    .then(r => r.blob())
                    .then(blob => {
                        const cleanBlob = new Blob([blob], { type: 'application/pdf' });
                        setPdfBlobUrl(URL.createObjectURL(cleanBlob));
                    })
                    .catch(err => console.error("Preview blob fetch failed", err));
            }

            setLoading(false);
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
                const filename = `${docName || 'document'}-${new Date().getTime()}.pdf`;
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
                    <h1 className="text-xl font-semibold text-gray-800 capitalize">
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
                    ) : isPdf && !pdfBlobUrl ? (
                        <div className="flex flex-col items-center justify-center">
                            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                            <p className="text-gray-600">Loading PDF...</p>
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
