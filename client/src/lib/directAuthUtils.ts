/**
 * Direct authentication utilities that work without requiring the AuthContext
 * This is useful as a fallback when the context is not available or when there are issues with the context
 */

import { signInWithGoogle as firebaseSignIn } from './firebase'; // Assuming this is the firebase.ts signInWithGoogle
import { User } from './authUtils'; // Assuming this User type is appropriate
import { apiRequest } from './queryClient'; // Import apiRequest

/**
 * Sign in with Google directly, bypassing the AuthContext
 * This is useful when the AuthContext is not available or when the Firebase popup loses context
 */
export const directGoogleSignIn = async (): Promise<{
  success: boolean;
  user?: User;
  error?: any;
}> => {
  try {
    console.log("Starting direct Google sign-in process...");

    // Use Firebase directly
    const result = await firebaseSignIn(); // This comes from ./firebase.ts

    if (!result.success || !result.user) {
      console.error("Firebase authentication failed");
      return { success: false, error: result.error };
    }

    console.log("Firebase authentication successful, registering with backend");

    // Register with our backend using apiRequest
    try {
      // Use apiRequest for the registration call
      const data = await apiRequest<{ success: boolean; user?: any; error?: string }>(
        'POST',
        '/users/firebase-auth', // Relative path
        {
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          uid: result.user.uid
        }
      );

      if (data.success && data.user) {
        console.log("Backend registration successful");

        // Create user object with proper type handling
        const user: User = {
          id: data.user.id || result.user.uid, // Use backend ID primarily
          name: data.user.name || result.user.displayName || 'User',
          email: data.user.email || result.user.email || '',
          // Explicitly handle photoURL to avoid null vs undefined type issues
          ...(result.user.photoURL ? { photoURL: result.user.photoURL } : {}),
          role: data.user.role || 'regular',
          userType: data.user.role || 'regular' // Ensure userType is consistent
        };

        // Store user in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Store email separately for session persistence
        if (user.email) {
          localStorage.setItem('auth_email', user.email);
        }

        // Dispatch event to notify components
        window.dispatchEvent(new Event('auth-state-changed'));

        return { success: true, user };
      } else {
        console.error("Backend registration failed:", data.error);
        return { success: false, error: data.error || "Backend registration failed" };
      }
    } catch (apiError) {
      console.error("API error during Firebase user registration:", apiError);
      return { success: false, error: apiError };
    }
  } catch (error) {
    console.error("Error in direct Google sign-in:", error);
    return { success: false, error };
  }
};

/**
 * Direct logout function that works without requiring the AuthContext
 * This is useful as a fallback when the context is not available
 */
export const directLogout = async (): Promise<boolean> => {
  try {
    // Clear stored authentication data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_email');

    // Send logout request to server using apiRequest
    try {
      // Use apiRequest for consistency, ignore response/errors for logout notification
      await apiRequest('POST', '/users/logout');
    } catch (e) {
      console.error("Error calling logout API:", e);
      // Continue with local logout even if API fails
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('auth-state-changed'));

    return true;
  } catch (error) {
    console.error("Error in direct logout:", error);
    return false;
  }
};
