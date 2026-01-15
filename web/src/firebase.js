// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "urbansetu-76c8c.firebaseapp.com",
  projectId: "urbansetu-76c8c",
  storageBucket: "urbansetu-76c8c.firebasestorage.app",
  messagingSenderId: "1085933309814",
  appId: "1:1085933309814:web:39232deaaee1f69272b457",
  measurementId: "G-M3EL8W29W9"
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