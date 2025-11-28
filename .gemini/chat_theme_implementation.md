# Chat Theme Implementation Plan

## Overview
Apply dark mode and theme colors throughout all chat interfaces in MyAppointments.jsx and AdminAppointments.jsx

## Files to Modify
1. `web/src/pages/MyAppointments.jsx` - Apply theme to appointment chat interface
2. `web/src/pages/AdminAppointments.jsx` - Apply theme to admin chat interface

## Implementation Steps

### Phase 1: Import Theme Utility
- Import `getThemeColors` and helper functions from `../utils/chatTheme.js`
- Add theme color state derived from settings

### Phase 2: Apply Theme to Main Chat Container
Areas to update:
- Chat modal background
- Chat header (use theme gradient)
- Chat messages container
- Input area background
- Scrollbars

### Phase 3: Apply Dark Mode to UI Elements
Elements to style based on isDarkMode:
- Message bubbles (sender/receiver)
- Input fields and textareas
- Buttons (send, attach, etc.)
- Dropdown menus
- Modals and overlays
- Timestamps
- User avatars borders
- Dividers and separators

### Phase 4: Apply Theme Colors to Accents
Elements to use theme colors:
- Header gradient background
- Active/selected states
- Primary action buttons
- Icons and indicators
- Links and highlights
- Focus rings

### Phase 5: Apply Accessibility Settings
- High contrast mode adjustments
- Reduced motion classes
- Large text scaling
- Screen reader optimizations

## Key Pattern to Follow

```javascript
// 1. Get theme colors
const themeColors = getThemeColors(settings.themeColor || 'blue');
const isDarkMode = settings.theme === 'dark';

// 2. Apply to containers
className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}

// 3. Apply to headers
className={`bg-gradient-to-r ${themeColors.primary}`}

// 4. Apply to buttons
className={`${themeColors.accentBg} ${themeColors.accentHover}`}

// 5. Apply accessibility
const { contrast, motion, text } = getAccessibilityClasses(settings);
className={`${contrast} ${motion} ${text}`}
```

## Testing Checklist
- [ ] Dark mode toggle works
- [ ] Theme color changes apply immediately
- [ ] All 10 theme colors work correctly
- [ ] Message bubbles styled correctly
- [ ] Input areas respond to dark mode
- [ ] Buttons and icons visible in both modes
- [ ] Accessibility settings apply correctly
- [ ] No visual glitches or contrast issues
- [ ] Settings persist after page reload

## Notes
- Keep existing functionality intact
- Maintain responsive design
- Ensure WCAG AA contrast standards
- Test with all theme combinations
