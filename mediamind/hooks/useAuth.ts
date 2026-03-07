import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { clearTokenCache } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes - matching index4.html approach
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isMounted) {
        console.log('🔄 Auth state changed:', user ? `✅ ${user.email}` : '❌ signed out');
        
        if (user) {
          // Log user profile information
          console.log('👤 User profile data:', {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            providerData: user.providerData.map(p => ({
              providerId: p.providerId,
              email: p.email,
              displayName: p.displayName,
              photoURL: p.photoURL
            }))
          });
          
          // If no photoURL, try to reload user profile
          if (!user.photoURL) {
            console.log('⚠️ No photoURL found, attempting to reload user profile...');
            try {
              await user.reload();
              console.log('🔄 User profile reloaded, new photoURL:', user.photoURL);
            } catch (reloadError) {
              console.error('❌ Failed to reload user profile:', reloadError);
            }
          }
        }
        
        setUser(user);
        setLoading(false);
        if (user) {
          setError(null);
          // Pre-fetch token when user signs in (like index4.html: idToken = await user.getIdToken())
          try {
            await user.getIdToken();
            console.log('✅ Token pre-fetched for API calls');
          } catch (err) {
            console.error('⚠️ Token pre-fetch failed:', err);
          }
        } else {
          // Clear token cache on sign out
          clearTokenCache();
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      // Use popup like the working index4.html version
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will automatically update the user state
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err?.message || 'Failed to sign in';
      setError(errorMessage);
      setLoading(false);
      
      // If popup is blocked, provide helpful error message
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled. Please try again.');
      }
      
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      clearTokenCache(); // Clear token cache on logout
      await signOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
  };
};
