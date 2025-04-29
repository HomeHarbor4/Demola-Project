// c:\Users\admin\Downloads\RealEstateSync\client\src\contexts\AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import {
  User,
  getCurrentUser,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  fetchUserProfile, // Import the profile fetch function
} from '@/lib/unifiedAuth'; // Import from your unified auth service
import { Spinner } from '@/components/Spinner'; // Assuming you have a Spinner

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<boolean>;
  refetchUser: () => Promise<void>; // Function to manually refetch user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until initial check is done

  // Function to update user state from storage or API
  const updateUserState = useCallback(async (checkApi: boolean = false) => {
    setIsLoading(true);
    let currentUser: User | null = getCurrentUser(); // Check local storage first

    if (currentUser && checkApi) {
        // If user found in storage, verify/refresh with API
        console.log("[AuthContext] Verifying stored user with API...");
        currentUser = await fetchUserProfile(); // fetchUserProfile handles storing/clearing
    } else if (!currentUser) {
        console.log("[AuthContext] No user found in storage.");
    }

    setUser(currentUser);
    setIsLoading(false);
    console.log("[AuthContext] User state updated:", currentUser);
  }, []);

  // Initial load: Check storage and potentially verify with API
  useEffect(() => {
    console.log("[AuthContext] Initializing and checking auth state...");
    updateUserState(true); // Check storage and verify with API on initial load
  }, [updateUserState]);

  // Listen for the custom auth state change event dispatched by unifiedAuth
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("[AuthContext] Received auth-state-changed event. Updating state from storage.");
      // When event occurs, just update state from storage (API verification happened on initial load/login)
      updateUserState(false); // Don't necessarily hit API on every storage change
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    console.log("[AuthContext] Added auth-state-changed listener.");

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      console.log("[AuthContext] Removed auth-state-changed listener.");
    };
  }, [updateUserState]); // Depend on updateUserState

  // Login function
  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const result = await apiLogin(usernameOrEmail, password); // Calls unifiedAuth login
    // unifiedAuth.login handles storing the user, which triggers the event listener to update state
    setIsLoading(false);
    return { success: result.success, message: result.message };
  }, []);

  // Google Login function
  const googleLogin = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const result = await apiLoginWithGoogle(); // Calls unifiedAuth google login
    // unifiedAuth.loginWithGoogle handles storing the user, triggering the event listener
    setIsLoading(false);
    return { success: result.success, message: result.message };
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    const success = await apiLogout(); // Calls unifiedAuth logout
    // unifiedAuth.logout handles clearing the user, triggering the event listener
    setIsLoading(false);
    return success;
  }, []);

  // Function to manually refetch user data
  const refetchUser = useCallback(async (): Promise<void> => {
      console.log("[AuthContext] Manually refetching user profile...");
      await updateUserState(true); // Force API check
  }, [updateUserState]);


  // Provide a loading state while checking initial auth status
  if (isLoading && user === null) { // Show loading only on initial load when user is null
      return (
          <div className="flex justify-center items-center min-h-screen">
              <Spinner />
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, googleLogin, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
