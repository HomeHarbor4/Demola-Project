// Authentication utilities

// Define a generic user interface that works with both Firebase and local auth
export interface User {
  id?: number | string;
  name?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  role?: string;
  userType?: 'admin' | 'agent' | 'regular' | null | string;
  [key: string]: any; // Allow any other properties
}

/**
 * Broadcast auth state change to all components
 * This is used to ensure all components update when auth state changes
 */
export function broadcastAuthChange(user: User | null): void {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }

  // Dispatch a custom event to notify all components
  window.dispatchEvent(new Event('auth-state-changed'));
}

/**
 * Updates authentication info in local storage based on the details from the AuthContext
 */
export function updateAuthStorage(user: User | null): void {
  if (user) {
    // Store user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Store email separately for session persistence
    if (user.email) {
      localStorage.setItem('auth_email', user.email);
    }
  } else {
    // Clear both user and email
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_email');
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUserFromStorage(): User | null {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem('currentUser');
  }
  return null;
}