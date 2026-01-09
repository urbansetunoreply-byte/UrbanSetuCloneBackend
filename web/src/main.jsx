import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.jsx'
import { store, persistor } from './redux/store.js'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import UserChangePassword from './pages/UserChangePassword';
import AdminChangePassword from './pages/AdminChangePassword';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {bootstrapped => (
        <GlobalErrorBoundary>
          <App bootstrapped={bootstrapped} />
        </GlobalErrorBoundary>
      )}
    </PersistGate>
  </Provider>,
)
