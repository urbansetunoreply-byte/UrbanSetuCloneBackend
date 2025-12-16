import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner, FaDownload, FaArrowLeft, FaFilePdf, FaImage, FaFileAlt } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ViewDocument() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const getFileExtension = (url) => {
        if (!url) return '';
        try {
            const urlPath = url.split('?')[0];
            return urlPath.substring(urlPath.lastIndexOf('.') + 1).toLowerCase();
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

    const extension = getFileExtension(document.url);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
    const isPdf = extension === 'pdf';

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
                <a
                    href={document.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FaDownload />
                    <span className="hidden sm:inline">Download</span>
                </a>
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
                            <p className="text-gray-600 mb-6">This file type ({extension}) cannot be previewed directly.</p>
                            <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FaDownload /> Download to View
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
