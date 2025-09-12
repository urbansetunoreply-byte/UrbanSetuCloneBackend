// Utility functions for mobile device detection and focus management

/**
 * Detects if the current device is a mobile device
 * @returns {boolean} true if mobile device, false otherwise
 */
export const isMobileDevice = () => {
  // Check for touch capability and screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  // Additional mobile detection
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  return hasTouch && (isSmallScreen || isMobileUA);
};

/**
 * Focuses an input element without opening the virtual keyboard on mobile devices
 * @param {HTMLInputElement|HTMLTextAreaElement} element - The element to focus
 * @param {number} cursorPosition - Position to place cursor (optional)
 */
export const focusWithoutKeyboard = (element, cursorPosition = null) => {
  if (!element) return;
  
  if (isMobileDevice()) {
    // On mobile, use a different approach to focus without opening keyboard
    // Set the element as active but prevent keyboard from opening
    element.focus({ preventScroll: true });
    
    // Set cursor position if specified
    if (cursorPosition !== null && element.setSelectionRange) {
      try {
        element.setSelectionRange(cursorPosition, cursorPosition);
      } catch (e) {
        // Fallback for elements that don't support setSelectionRange
        element.focus();
      }
    }
    
    // Blur immediately to prevent keyboard from opening
    setTimeout(() => {
      element.blur();
      // Then focus again without triggering keyboard
      element.focus({ preventScroll: true });
    }, 0);
  } else {
    // On desktop, use normal focus behavior
    element.focus();
    if (cursorPosition !== null && element.setSelectionRange) {
      try {
        element.setSelectionRange(cursorPosition, cursorPosition);
      } catch (e) {
        // Fallback
        element.focus();
      }
    }
  }
};

/**
 * Focuses an input element with normal behavior (keyboard will open on mobile)
 * @param {HTMLInputElement|HTMLTextAreaElement} element - The element to focus
 * @param {number} cursorPosition - Position to place cursor (optional)
 */
export const focusWithKeyboard = (element, cursorPosition = null) => {
  if (!element) return;
  
  element.focus();
  if (cursorPosition !== null && element.setSelectionRange) {
    try {
      element.setSelectionRange(cursorPosition, cursorPosition);
    } catch (e) {
      // Fallback
      element.focus();
    }
  }
};