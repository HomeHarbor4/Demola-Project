// c:\Users\admin\Downloads\RealEstateSync\client\src\lib\unifiedAuth.ts

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from "firebase/auth";
import app from "./firebase"; // Your firebase app initialization
import { apiRequest } from "./queryClient"; // Your API request utility

// Initialize Firebase Auth (if not already done in firebase.ts)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Define a consistent user model matching backend and frontend needs
// Ensure this matches the type returned by your backend user endpoints
export interface User {
  id: number; // Assuming backend uses number ID
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: 'user' | 'agent' | 'admin';
  photoURL?: string | null;
  firebaseUid?: string | null; // For linking Firebase accounts
  createdAt?: string | Date; // Optional, depending on backend response
  // Add any other relevant fields returned by your backend
}

// --- Storage and Event Constants ---
const USER_STORAGE_KEY = 'currentUser';
const AUTH_EVENT = 'auth-state-changed'; // Custom event name

// --- Helper Functions ---

/**
 * Dispatches the custom auth state change event.
 */
function dispatchAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * Gets the current user from localStorage.
 * @returns {User | null} The stored user or null if not found/invalid.
 */
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStr) return null;
    // TODO: Add validation here? Maybe check for essential fields like id, email, role.
    return JSON.parse(userStr) as User;
  } catch (err) {
    console.error('Error getting current user from localStorage:', err);
    localStorage.removeItem(USER_STORAGE_KEY); // Clear invalid data
    return null;
  }
}

/**
 * Stores the user object in localStorage and dispatches the auth change event.
 * @param {User} user - The user object to store.
 */
export function storeUser(user: User): void {
  if (!user || !user.id || !user.email || !user.role) {
      console.error("Attempted to store invalid user object:", user);
      // Optionally clear storage if invalid user is passed
      // clearUser();
      return;
  }
  try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      console.log("User stored in localStorage:", user);
      dispatchAuthChange();
  } catch (err) {
      console.error("Error storing user in localStorage:", err);
  }
}

/**
 * Clears the user object from localStorage and dispatches the auth change event.
 */
export function clearUser(): void {
  try {
      localStorage.removeItem(USER_STORAGE_KEY);
      // Optionally remove other related keys if needed
      // localStorage.removeItem('some_other_auth_key');
      console.log("User cleared from localStorage.");
      dispatchAuthChange();
  } catch (err) {
      console.error("Error clearing user from localStorage:", err);
  }
}

/**
 * Checks if a user is currently considered logged in based on localStorage.
 * @returns {boolean} True if a user is found in storage, false otherwise.
 */
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}

/**
 * Checks if the currently stored user has the 'admin' role.
 * @returns {boolean} True if the user is an admin, false otherwise.
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
}

/**
 * Checks if the currently stored user has the 'agent' role.
 * @returns {boolean} True if the user is an agent, false otherwise.
 */
export function isAgent(): boolean {
  const user = getCurrentUser();
  return !!user && user.role === 'agent';
}


// --- Authentication Methods ---

/**
 * Logs in a user with username/email and password via the backend API.
 * @param {string} usernameOrEmail - The user's username or email.
 * @param {string} password - The user's password.
 * @returns {Promise<{success: boolean, user?: User, message?: string}>} Result object.
 */
export async function login(usernameOrEmail: string, password: string): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> {
  console.log(`[unifiedAuth] Attempting login for: ${usernameOrEmail}`);
  try {
    // API request to the backend login endpoint
    const response = await apiRequest<{ success: boolean; user?: User; message?: string }>(
      'POST',
      '/users/login', // Backend endpoint
      { usernameOrEmail, password } // Correct payload key
    );

    if (response.success && response.user) {
      console.log("[unifiedAuth] Login successful via API:", response.user);
      storeUser(response.user); // Store user on successful login
      return { success: true, user: response.user };
    } else {
      console.warn("[unifiedAuth] Login failed via API:", response.message);
      clearUser(); // Ensure user is cleared on failed login
      return { success: false, message: response.message || 'Invalid credentials' };
    }
  } catch (error: any) {
    console.error('[unifiedAuth] Login API request error:', error);
    clearUser(); // Ensure user is cleared on error
    return { success: false, message: error.message || 'Login failed due to a server error.' };
  }
}

/**
 * Registers or authenticates a user via Firebase (Google) and syncs with the backend.
 * @param {FirebaseUser} firebaseUser - The user object from Firebase Auth.
 * @returns {Promise<User | null>} The synced application User object or null on failure.
 */
async function syncFirebaseUserWithBackend(firebaseUser: FirebaseUser): Promise<User | null> {
  console.log(`[unifiedAuth] Syncing Firebase user ${firebaseUser.email} with backend.`);
  try {
    // API request to the backend Firebase auth endpoint
    const response = await apiRequest<{ success: boolean; user?: User; message?: string }>(
      'POST',
      '/users/firebase-auth', // Backend endpoint for Firebase users
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      }
    );

    if (response.success && response.user) {
      console.log("[unifiedAuth] Firebase user sync successful:", response.user);
      // Ensure the returned user object matches the User interface
      const appUser: User = {
          ...response.user, // Spread backend data first
          id: response.user.id, // Ensure backend ID is used
          email: response.user.email || firebaseUser.email || '', // Prioritize backend email
          name: response.user.name || firebaseUser.displayName || 'User', // Prioritize backend name
          photoURL: response.user.photoURL || firebaseUser.photoURL || null, // Prioritize backend photo
          firebaseUid: firebaseUser.uid, // Always include Firebase UID
          role: response.user.role || 'user', // Default to 'user' if backend doesn't provide
      };
      return appUser;
    } else {
      console.error("[unifiedAuth] Backend sync failed for Firebase user:", response.message);
      return null;
    }
  } catch (error: any) {
    console.error('[unifiedAuth] Backend sync API request error:', error);
    return null;
  }
}

/**
 * Initiates the Google Sign-In popup flow and syncs the user with the backend.
 * @returns {Promise<{success: boolean, user?: User, message?: string}>} Result object.
 */
export async function loginWithGoogle(): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> {
  console.log("[unifiedAuth] Initiating Google Sign-In.");
  try {
    // Clear any previous local session first
    clearUser();

    // Sign in using Firebase popup
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    if (!firebaseUser) {
      throw new Error("Google Sign-In did not return a user.");
    }
    console.log("[unifiedAuth] Google Sign-In successful with Firebase:", firebaseUser.email);

    // Sync the Firebase user with our backend
    const appUser = await syncFirebaseUserWithBackend(firebaseUser);

    if (appUser) {
      storeUser(appUser); // Store the synced user
      return { success: true, user: appUser };
    } else {
      // Attempt to sign out from Firebase if backend sync failed
      await firebaseSignOut(auth).catch(err => console.error("Firebase sign out failed after backend sync error:", err));
      return { success: false, message: 'Failed to sync Google user with backend.' };
    }
  } catch (error: any) {
    console.error('[unifiedAuth] Google Sign-In process error:', error);
    clearUser(); // Ensure cleanup on error
    let message = 'An unexpected error occurred during Google Sign-In.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Google Sign-In cancelled by user.';
    } else if (error.message) {
      message = error.message;
    }
    return { success: false, message };
  }
}

/**
 * Logs the user out from Firebase (if applicable) and clears local storage.
 * Notifies the backend about the logout attempt.
 * @returns {Promise<boolean>} True if logout process completed, false otherwise (though cleanup is attempted).
 */
export async function logout(): Promise<boolean> {
  console.log('[unifiedAuth] Initiating logout process.');
  try {
    // 1. Clear local user state immediately
    clearUser();

    // 2. Attempt to sign out from Firebase
    try {
      if (getAuth(app).currentUser) { // Check if a Firebase user is actually signed in
        await firebaseSignOut(auth);
        console.log('[unifiedAuth] Signed out from Firebase.');
      } else {
        console.log('[unifiedAuth] No active Firebase session to sign out.');
      }
    } catch (firebaseError) {
      console.warn('[unifiedAuth] Error signing out from Firebase (continuing logout):', firebaseError);
      // Don't stop the logout process if Firebase fails
    }

    // 3. Notify the backend (optional, fire-and-forget)
    try {
      await apiRequest('POST', '/users/logout');
      console.log('[unifiedAuth] Backend logout notification sent.');
    } catch (backendError) {
      console.warn('[unifiedAuth] Error notifying backend of logout (continuing logout):', backendError);
      // Don't stop the logout process if backend notification fails
    }

    console.log('[unifiedAuth] Logout process completed.');
    return true;
  } catch (error) {
    // Catch any unexpected errors during the overall process
    console.error('[unifiedAuth] Critical error during logout:', error);
    // Ensure cleanup happens even if there's an unexpected error
    clearUser();
    return false;
  }
}

/**
 * Fetches the user profile from the backend using the stored email.
 * Useful for verifying the session and getting updated user data.
 * @returns {Promise<User | null>} The user profile or null if not found or error.
 */
export async function fetchUserProfile(): Promise<User | null> {
    const storedUser = getCurrentUser();
    if (!storedUser?.email) {
        console.log("[unifiedAuth] Cannot fetch profile, no stored user/email.");
        clearUser(); // Clear potentially inconsistent state
        return null;
    }

    console.log(`[unifiedAuth] Fetching profile for email: ${storedUser.email}`);
    try {
        const response = await apiRequest<{ success: boolean; user?: User; message?: string }>(
            'GET',
            `/users/profile?email=${encodeURIComponent(storedUser.email)}`
        );

        if (response.success && response.user) {
            console.log("[unifiedAuth] Profile fetched successfully:", response.user);
            // Re-store the potentially updated user data
            storeUser(response.user);
            return response.user;
        } else {
            console.warn("[unifiedAuth] Failed to fetch profile or user not found:", response.message);
            // If profile fetch fails, the stored user might be invalid, so clear it
            clearUser();
            return null;
        }
    } catch (error: any) {
        console.error("[unifiedAuth] Error fetching user profile:", error);
        // If profile fetch fails due to network/server error, clear local state
        clearUser();
        return null;
    }
}


// --- Initialization ---

// Listen for storage events to sync auth state across tabs/windows
window.addEventListener('storage', (event) => {
  if (event.key === USER_STORAGE_KEY) {
    console.log('[unifiedAuth] Storage event detected for user key. Dispatching auth change.');
    dispatchAuthChange();
  }
});

console.log("[unifiedAuth] Service initialized.");
