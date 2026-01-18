// API Constants for both Web and Mobile
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://urbansetu-pvt4.onrender.com' 
  : 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: '/api/auth/signup',
    SIGNIN: '/api/auth/signin',
    SIGNOUT: '/api/auth/signout',
    GOOGLE: '/api/auth/google',
  },
  
  // User Management
  USER: {
    PROFILE: '/api/user/update',
    DELETE: '/api/user/delete',
    LISTINGS: '/api/user/listings',
  },
  
  // Property Listings
  LISTINGS: {
    BASE: '/api/listing',
    CREATE: '/api/listing/create',
    SEARCH: '/api/listing/get',
    UPDATE: '/api/listing/update',
    DELETE: '/api/listing/delete',
  },
  
  // Bookings/Appointments
  BOOKINGS: {
    BASE: '/api/bookings',
    CREATE: '/api/bookings',
    UPDATE: '/api/bookings',
    ARCHIVED: '/api/bookings/archived',
  },
  
  // Wishlist
  WISHLIST: {
    BASE: '/api/wishlist',
    ADD: '/api/wishlist/add',
    REMOVE: '/api/wishlist/remove',
  },
  
  // Contact
  CONTACT: {
    BASE: '/api/contact',
    SUBMIT: '/api/contact/submit',
  },
  
  // Admin
  ADMIN: {
    REQUESTS: '/api/admin/pending-requests',
    APPROVE: '/api/admin/approve',
    REJECT: '/api/admin/reject',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/api/upload/image',
    DOCUMENT: '/api/upload/document',
  }
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  COMMENT_UPDATE: 'commentUpdate',
  APPOINTMENT_UPDATE: 'appointmentUpdate',
  NOTIFICATION: 'notification',
};
