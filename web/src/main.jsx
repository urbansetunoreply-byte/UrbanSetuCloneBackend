import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.jsx'
import { store, persistor } from './redux/store.js'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {bootstrapped => (
        <HelmetProvider>
          <GlobalErrorBoundary>
            <App bootstrapped={bootstrapped} />
          </GlobalErrorBoundary>
        </HelmetProvider>
      )}
    </PersistGate>
  </Provider>,
)
