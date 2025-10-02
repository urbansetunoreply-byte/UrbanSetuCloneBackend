// reCAPTCHA configuration
export const RECAPTCHA_CONFIG = {
  // Site key for frontend (public)
  SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  
  // API endpoints
  VERIFY_URL: 'https://www.google.com/recaptcha/api/siteverify',
  
  // Configuration options
  OPTIONS: {
    theme: 'light', // 'light' or 'dark'
    size: 'normal', // 'normal' or 'compact'
    type: 'image', // 'image' or 'audio'
    tabindex: 0,
    hl: 'en' // language
  }
};

// Fallback configuration for hCaptcha (for easy migration)
export const HCAPTCHA_CONFIG = {
  SITE_KEY: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
  VERIFY_URL: 'https://hcaptcha.com/siteverify',
  OPTIONS: {
    theme: 'light',
    size: 'normal',
    tabindex: 0
  }
};

// Get current captcha provider (can be easily switched)
export const getCurrentCaptchaConfig = () => {
  const provider = import.meta.env.VITE_CAPTCHA_PROVIDER || 'recaptcha';
  return provider === 'hcaptcha' ? HCAPTCHA_CONFIG : RECAPTCHA_CONFIG;
};

// Validation helper
export const validateCaptchaConfig = () => {
  const config = getCurrentCaptchaConfig();
  if (!config.SITE_KEY) {
    console.warn(`Missing ${config === HCAPTCHA_CONFIG ? 'HCAPTCHA' : 'RECAPTCHA'} site key in environment variables`);
    return false;
  }
  return true;
};
