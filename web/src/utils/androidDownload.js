// Android App Download Utility
// Handles APK download with proper MIME type and filename

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Cache for active deployments
let activeDeploymentsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get active deployments from admin system
const getActiveDeployments = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (activeDeploymentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return activeDeploymentsCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/deployment/active`);
    const data = await response.json();
    
    if (data.success) {
      activeDeploymentsCache = data.data;
      cacheTimestamp = now;
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching active deployments:', error);
  }
  
  return [];
};

// Get the latest Android APK URL
const getLatestAndroidApkUrl = async () => {
  try {
    const activeDeployments = await getActiveDeployments();
    const androidApk = activeDeployments.find(file => 
      file.platform === 'android' && file.format === 'apk'
    );
    
    if (androidApk) {
      return androidApk.url;
    }
  } catch (error) {
    console.error('Error getting latest Android APK:', error);
  }
  
  // Fallback to static URL
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/raw/upload/v1/urbansetu-debug.apk`;
  }
  
  return 'https://res.cloudinary.com/dl462tj9t/raw/upload/v1/urbansetu-debug.apk';
};

// Alternative fallback URL (you can host the APK on your own server)
const APK_FALLBACK_URL = '/downloads/UrbanSetu_debug.apk';

/**
 * Downloads the Android APK file
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadAndroidApp = async (filename = 'UrbanSetu_debug.apk') => {
  try {
    // Get the latest Android APK URL
    const apkUrl = await getLatestAndroidApkUrl();
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    return {
      success: true,
      message: 'Android app download started!'
    };
  } catch (error) {
    console.error('Download failed:', error);
    
    // Try fallback URL
    try {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = APK_FALLBACK_URL;
      fallbackLink.download = filename;
      fallbackLink.style.display = 'none';
      
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      
      return {
        success: true,
        message: 'Android app download started!'
      };
    } catch (fallbackError) {
      console.error('Fallback download failed:', fallbackError);
      return {
        success: false,
        message: 'Download failed. Please try again or contact support.'
      };
    }
  }
};

/**
 * Checks if the user is on a mobile device
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Checks if the user is on Android specifically
 * @returns {boolean} True if Android device
 */
export const isAndroidDevice = () => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * Gets appropriate download message based on device
 * @returns {string} Download message
 */
export const getDownloadMessage = () => {
  if (isAndroidDevice()) {
    return 'Download our Android app for the best mobile experience!';
  } else if (isMobileDevice()) {
    return 'Download our Android app (iOS version coming soon)!';
  } else {
    return 'Download our Android app to access UrbanSetu on your mobile device!';
  }
};

/**
 * Gets appropriate button text based on device
 * @returns {string} Button text
 */
export const getDownloadButtonText = () => {
  if (isAndroidDevice()) {
    return '📱 Download Android App';
  } else if (isMobileDevice()) {
    return '📱 Download for Android';
  } else {
    return '📱 Download Android App';
  }
};

/**
 * Handles the download with user feedback
 * @param {Function} showToast - Toast notification function
 * @param {string} filename - APK filename
 */
export const handleAndroidDownload = async (showToast, filename = 'UrbanSetu_debug.apk') => {
  try {
    const result = await downloadAndroidApp(filename);
    
    if (result.success) {
      showToast.success(result.message);
    } else {
      showToast.error(result.message);
    }
  } catch (error) {
    console.error('Download error:', error);
    showToast.error('Download failed. Please try again.');
  }
};
