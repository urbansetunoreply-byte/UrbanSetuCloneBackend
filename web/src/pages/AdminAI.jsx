import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GeminiChatbox from '../components/GeminiChatbox';
import AdminDashboard from './AdminDashboard';

import { usePageTitle } from '../hooks/usePageTitle';
export default function AdminAI() {
  // Set page title
  usePageTitle("AI Assistant - Admin Panel");

  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState(null);

  useEffect(() => {
    // Get the previous URL from state or default to admin dashboard
    const from = location.state?.from || '/admin';
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
    <div>
      {/* Render the previous page content behind the modal */}
      <AdminDashboard />
      
      {/* Render GeminiChatbox with custom modal control */}
      <GeminiChatbox 
        forceModalOpen={isModalOpen}
        onModalClose={handleModalClose}
      />
    </div>
  );
}
