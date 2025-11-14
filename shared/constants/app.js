// App Constants for both Web and Mobile
export const APP_CONFIG = {
  NAME: 'UrbanSetu',
  VERSION: '1.0.0',
  DESCRIPTION: 'Real Estate Management Platform',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ROOT_ADMIN: 'rootadmin',
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const PROPERTY_TYPES = {
  RENT: 'rent',
  SALE: 'sale',
};

export const PROPERTY_CATEGORIES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  CONDO: 'condo',
  TOWNHOUSE: 'townhouse',
  VILLA: 'villa',
  STUDIO: 'studio',
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-\(\)]{10,}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  DEVICE_TOKEN: 'deviceToken',
};

export const COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#8B5CF6',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#06B6D4',
  LIGHT: '#F8FAFC',
  DARK: '#1E293B',
  GRAY: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};
