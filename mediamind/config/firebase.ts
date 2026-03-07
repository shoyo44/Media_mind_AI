import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your MediaMind AI Firebase Configuration
const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "mediamind-ai-11a91.firebaseapp.com",
  projectId: "mediamind-ai-11a91",
  storageBucket: "mediamind-ai-11a91.firebasestorage.app",
  messagingSenderId: "241923240065",
  appId: "1:241923240065:web:3a2677f2398b46d4db1d80",
  measurementId: "G-BM1LYKGS4G"
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