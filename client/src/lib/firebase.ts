import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate that we have the required firebase configuration
const hasValidConfig = 
  !!import.meta.env.VITE_FIREBASE_API_KEY && 
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  !!import.meta.env.VITE_FIREBASE_APP_ID;

if (!hasValidConfig) {
  console.log(import.meta.env)
  console.error("Firebase configuration is incomplete. Google Sign-In may not work properly.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase project configuration loaded");

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google sign-in functions
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in process...");
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return {
      success: false,
      error
    };
  }
};

// Firebase sign out - enhanced with debugging
export const signOut = async () => {
  console.log("SIGNOUT: Starting Firebase sign out process");
  
  try {
    console.log("SIGNOUT: Current auth state before signout:", auth.currentUser ? "User is logged in" : "No user");
    
    // Only attempt to sign out if there's a user
    if (auth.currentUser) {
      console.log("SIGNOUT: Calling Firebase signOut method");
      await firebaseSignOut(auth);
      console.log("SIGNOUT: Firebase signOut completed successfully");
      return { success: true };
    } else {
      console.log("SIGNOUT: No user to sign out from Firebase");
      return { success: true, message: "No user to sign out" };
    }
  } catch (error) {
    console.error("SIGNOUT ERROR:", error);
    // Try to continue even after error
    return { success: false, error };
  } finally {
    console.log("SIGNOUT: Final auth state:", auth.currentUser ? "User still logged in" : "No user");
  }
};

// Subscribe to auth state changes
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  console.log("Setting up auth state listener");
  return onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
    callback(user);
  });
};

export { auth, googleProvider };
export default app;