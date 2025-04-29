// c:\Users\admin\Downloads\RealEstateSync\client\src\contexts\AdminContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './AuthContext'; // Import useAuth from AuthContext
import type { User as AuthUser } from '@/lib/unifiedAuth'; // Import the User type from unifiedAuth

// Define a specific type for the admin user context if needed,
// or reuse the AuthUser type if it's sufficient.
// Using AuthUser for simplicity here.
type AdminUser = AuthUser;

interface AdminContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  adminLogOut: () => void;
  isAdmin: boolean; // Changed to a boolean state
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === null) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminState, setIsAdminState] = useState<boolean>(false); // State for boolean check
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const auth = useAuth(); // Get user and loading state from AuthContext

  // Determine admin status based on the user from AuthContext
  useEffect(() => {
    setLoading(auth.isLoading); // Sync loading state

    if (!auth.isLoading) {
      // Check if the authenticated user is an admin
      const currentIsAdmin = !!auth.user && auth.user.role === 'admin';
      setIsAdminState(currentIsAdmin);

      if (currentIsAdmin) {
        // If admin, set the adminUser state (using the user object from AuthContext)
        setAdminUser(auth.user);
        console.log("[AdminContext] Admin user set:", auth.user);
      } else {
        // If not admin, clear the adminUser state
        setAdminUser(null);
        console.log("[AdminContext] No admin user found.");
      }
    } else {
      // While auth is loading, clear admin state
      setAdminUser(null);
      setIsAdminState(false);
    }
  }, [auth.user, auth.isLoading]); // Depend on user and loading state from AuthContext

  // Admin logout - delegate to auth context's logout
  const adminLogOut = async () => {
    console.log("[AdminContext] Initiating admin logout.");
    await auth.logout(); // Call the main logout function
    // No need to manually set location here if AuthContext handles redirects or state updates properly
    // setLocation('/signin'); // Consider if redirect is needed here or handled elsewhere
  };

  const value: AdminContextType = {
    adminUser,
    loading,
    adminLogOut,
    isAdmin: isAdminState // Provide the boolean state
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
