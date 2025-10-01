import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GeminiChatbox from '../components/GeminiChatbox';

export default function PublicAI() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState(null);

  useEffect(() => {
    // Get the previous URL from state or default to home
    const from = location.state?.from || '/';
    setPreviousUrl(from);
    
    // Open modal immediately when page loads
    setIsModalOpen(true);
  }, [location.state]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Navigate back to previous URL after a short delay to allow modal close animation
    setTimeout(() => {
      navigate(previousUrl, { replace: true });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Opening AI assistant...</p>
      </div>
      
      {/* Render GeminiChatbox with custom modal control */}
      <GeminiChatbox 
        forceModalOpen={isModalOpen}
        onModalClose={handleModalClose}
        previousUrl={previousUrl}
      />
    </div>
  );
}
