import { createContext, useContext, useState } from 'react';

const HeaderContext = createContext();

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};

export const HeaderProvider = ({ children }) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const hideHeader = () => setIsHeaderVisible(false);
  const showHeader = () => setIsHeaderVisible(true);
  const toggleHeader = () => setIsHeaderVisible(prev => !prev);

  return (
    <HeaderContext.Provider value={{
      isHeaderVisible,
      hideHeader,
      showHeader,
      toggleHeader
    }}>
      {children}
    </HeaderContext.Provider>
  );
};
