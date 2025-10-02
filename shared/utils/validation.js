// Validation utilities for both Web and Mobile
import { VALIDATION_RULES } from '../constants/app.js';

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION_RULES.EMAIL.test(email)) return 'Please enter a valid email';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
};

export const validateName = (name, fieldName = 'Name') => {
  if (!name) return `${fieldName} is required`;
  if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return `${fieldName} must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`;
  }
  if (name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return `${fieldName} must not exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`;
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!VALIDATION_RULES.PHONE.test(phone)) return 'Please enter a valid phone number';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validatePrice = (price) => {
  if (!price) return 'Price is required';
  if (isNaN(price) || parseFloat(price) <= 0) return 'Price must be a positive number';
  return null;
};

export const validateUrl = (url) => {
  if (!url) return null; // URL is optional
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required) {
      const error = validateRequired(value, rule.label || field);
      if (error) {
        errors[field] = error;
        return;
      }
    }
    
    if (value && rule.type) {
      let error = null;
      
      switch (rule.type) {
        case 'email':
          error = validateEmail(value);
          break;
        case 'password':
          error = validatePassword(value);
          break;
        case 'phone':
          error = validatePhone(value);
          break;
        case 'price':
          error = validatePrice(value);
          break;
        case 'url':
          error = validateUrl(value);
          break;
        case 'name':
          error = validateName(value, rule.label);
          break;
      }
      
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
