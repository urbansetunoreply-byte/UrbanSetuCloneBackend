import { useEffect } from 'react';

/**
 * Custom hook to set page title dynamically
 * @param {string} title - The page title
 * @param {string} suffix - Optional suffix (defaults to "UrbanSetu")
 */
export const usePageTitle = (title, suffix = "UrbanSetu") => {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${suffix}` : suffix;
    document.title = fullTitle;
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "UrbanSetu · Smart Real Estate Platform for Buying, Selling & Renting Properties";
    };
  }, [title, suffix]);
};

export default usePageTitle;
