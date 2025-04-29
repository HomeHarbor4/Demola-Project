/**
 * Firebase Authentication Manager
 *
 * This is a simplified, self-contained authentication manager for Firebase.
 * It handles all aspects of Firebase authentication in a single file without
 * dependencies on contexts or complex patterns.
 */

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import app from "./firebase";
import { apiRequest } from "./queryClient"; // Import apiRequest

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// User interface matching both Firebase user and our application user
export interface User {
  id: string | number;
  uid?: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

// Get current user from local storage
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (e) {
    console.error("Error reading user from localStorage:", e);
    localStorage.removeItem('user');
  }
  return null;
};

// Store user in local storage
export const storeUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));

  // Dispatch event to notify components
  window.dispatchEvent(new Event('auth-changed'));
};

// Clear user from local storage
export const clearUser = (): void => {
  localStorage.removeItem('user');

  // Dispatch event to notify components
  window.dispatchEvent(new Event('auth-changed'));
};

// Convert Firebase user to app user
export const convertFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || '',
    displayName: fbUser.displayName || '',
    photoURL: fbUser.photoURL || undefined,
  };
};

// Register a Firebase user with our backend using apiRequest
export const registerUserWithBackend = async (user: User): Promise<User | null> => {
  try {
    // Use apiRequest for the registration call
    const data = await apiRequest<{ success: boolean; user?: any; error?: string }>(
      'POST',
      '/users/firebase-auth', // Relative path for apiRequest
      {
        email: user.email,
        name: user.name || user.displayName,
        photoURL: user.photoURL,
        uid: user.uid || user.id
      }
    );

    if (data.success && data.user) {
      console.log("Successfully registered with backend:", data.user);

      // Create combined user object with Firebase and backend data
      const registeredUser: User = {
        ...user,
        id: data.user.id || user.id, // Use backend ID primarily
        role: data.user.role || 'regular',
      };

      return registeredUser;
    } else {
      console.error("Failed to register with backend:", data.error || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("API error during registration:", error);
    return null;
  }
};

/**
 * Sign in with Google and register with our backend
 */
export const signInWithGoogle = async (): Promise<{
  success: boolean;
  user?: User;
  error?: any;
}> => {
  try {
    console.log("Starting Google sign-in process...");

    // Use Firebase to authenticate
    const result = await signInWithPopup(auth, googleProvider);

    if (!result || !result.user) {
      return { success: false, error: new Error("No user returned from Firebase") };
    }

    console.log("Firebase authentication successful");

    // Convert Firebase user to app user
    const firebaseUser = convertFirebaseUser(result.user);

    // Register with our backend
    const registeredUser = await registerUserWithBackend(firebaseUser);

    if (!registeredUser) {
      return { success: false, error: new Error("Failed to register with backend") };
    }

    // Store user in local storage
    storeUser(registeredUser);

    return { success: true, user: registeredUser };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { success: false, error };
  }
};

/**
 * Sign out from Firebase and our application
 * Enhanced with debugging and fallback mechanisms
 */
export const signOut = async (): Promise<boolean> => {
  console.log("FBAM: Starting Firebase sign out sequence");

  // Clear all application storage first for immediate UI cleanup
  console.log("FBAM: Clearing local storage");
  clearUser();
  localStorage.removeItem('auth_email');

  // Dispatch multiple events for any components listening
  console.log("FBAM: Dispatching auth change events");
  window.dispatchEvent(new Event('auth-changed'));
  window.dispatchEvent(new Event('auth-state-changed'));
  window.dispatchEvent(new Event('storage'));

  try {
    // Check initial Firebase auth state
    console.log("FBAM: Current Firebase auth state:",
      auth.currentUser ? `User ${auth.currentUser.uid} is logged in` : "No user");

    if (auth.currentUser) {
      // Attempt Firebase signout
      console.log("FBAM: Calling Firebase signOut");
      await firebaseSignOut(auth);
      console.log("FBAM: Firebase signOut completed successfully");
    } else {
      console.log("FBAM: No Firebase user to sign out");
    }

    // Extra check to ensure the user was actually signed out
    console.log("FBAM: Firebase auth state after signOut:",
      auth.currentUser ? `User ${auth.currentUser.uid} is still logged in` : "No user");

    // Attempt a forced reload of the auth state if user is still logged in
    if (auth.currentUser) {
      console.log("FBAM: User still logged in after signOut, attempting forced auth reload");
      try {
        await auth.currentUser.reload();
        console.log("FBAM: Forced auth reload completed");
      } catch (reloadError) {
        console.error("FBAM: Error during forced auth reload:", reloadError);
      }
    }

    // Notify backend using apiRequest
    try {
      console.log("FBAM: Notifying backend about logout");
      // Use apiRequest for consistency, ignore response/errors for logout notification
      await apiRequest('POST', '/users/logout');
      console.log("FBAM: Backend notification successful");
    } catch (e) {
      console.error("FBAM: Error notifying backend of logout:", e);
      // Continue with logout even if backend call fails
    }

    // A final cleanup
    console.log("FBAM: Final cleanup in case anything was missed");
    clearUser();
    localStorage.removeItem('auth_email');

    console.log("FBAM: Sign out process complete");
    return true;
  } catch (error) {
    console.error("FBAM: Sign out critical error:", error);

    // Still clear user data even if Firebase signout fails
    console.log("FBAM: Performing emergency cleanup after error");
    clearUser();
    localStorage.removeItem('auth_email');

    // Try to dispatch events anyway
    window.dispatchEvent(new Event('auth-changed'));
    window.dispatchEvent(new Event('auth-state-changed'));
    window.dispatchEvent(new Event('storage'));

    return false;
  }
};

/**
 * Setup an auth state listener
 */
export const setupAuthStateListener = (): void => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      console.log("Firebase auth state changed: User logged in");

      // Check if we already have a stored user to avoid unnecessary backend calls
      const storedUser = getCurrentUser();

      // If we have a stored user with the same UID, use that
      if (storedUser && (storedUser.uid === firebaseUser.uid || storedUser.id === firebaseUser.uid)) {
        console.log("Using stored user:", storedUser);
        // Make sure local storage is up to date
        storeUser(storedUser);
        return;
      }

      // Otherwise register with backend
      const appUser = convertFirebaseUser(firebaseUser);
      const registeredUser = await registerUserWithBackend(appUser);

      if (registeredUser) {
        storeUser(registeredUser);
      }
    } else {
      console.log("Firebase auth state changed: No user");

      // Do not clear the user here - we want to keep them signed in
      // even if Firebase session expires, as long as they haven't explicitly signed out
    }
  });
};

/**
 * Check if a user is currently logged in
 */
export const isLoggedIn = (): boolean => {
  return !!getCurrentUser();
};

/**
 * Check if the current user is an admin
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
};

// Initialize auth state listener
setupAuthStateListener();

