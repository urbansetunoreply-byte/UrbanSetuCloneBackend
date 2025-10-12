import React from "react";
import Profile from "./Profile";

import { usePageTitle } from '../hooks/usePageTitle';
export default function AdminProfile() {
  // Set page title
  usePageTitle("Admin Profile - Account Settings");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
      <Profile />
    </div>
  );
} 
