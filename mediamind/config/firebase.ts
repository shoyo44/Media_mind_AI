import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your MediaMind AI Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mediamind-ai-11a91.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mediamind-ai-11a91",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mediamind-ai-11a91.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "241923240065",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:241923240065:web:3a2677f2398b46d4db1d80",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BM1LYKGS4G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider to request profile information
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;