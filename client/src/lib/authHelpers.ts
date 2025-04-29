/**
 * Simple authentication helpers for direct auth without context dependencies
 */

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

/**
 * Get the current user from localStorage
 */
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    return JSON.parse(userStr) as User;
  } catch (err) {
    console.error('Error getting current user from localStorage:', err);
    return null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}

/**
 * Check if current user is an admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
}

/**
 * Log out the user
 * @param redirectUrl Optional URL to redirect to after logout
 */
export function logout(redirectUrl: string = '/'): void {
  console.log("Logging out user");
  // Clear user data from localStorage
  localStorage.removeItem('currentUser');
  
  // Dispatch event for components that listen to auth changes
  window.dispatchEvent(new Event('storage'));
  
  // If redirect URL provided, navigate there
  if (redirectUrl) {
    console.log("Redirecting to:", redirectUrl);
    window.location.href = redirectUrl;
  }
}