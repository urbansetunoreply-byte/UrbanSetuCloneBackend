// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "urbansetu-cce72.firebaseapp.com",
  projectId: "urbansetu-cce72",
  storageBucket: "urbansetu-cce72.firebasestorage.app",
  messagingSenderId: "687584735858",
  appId: "1:687584735858:web:9dc0b4c6c5366fc8d9c8eb",
  measurementId: "G-XEM5X816TY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported and not blocked
let analytics = null;
try {
  // Check if analytics is supported and not blocked by ad blockers
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } else {
        console.log('Firebase Analytics not supported');
      }
    }).catch((error) => {
      console.log('Firebase Analytics blocked or not available:', error);
    });
  }
} catch (error) {
  console.log('Firebase Analytics initialization failed:', error);
}

export { app, analytics };