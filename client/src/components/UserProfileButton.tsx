import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getCurrentUser, isAdmin as checkIsAdmin, logout } from '@/lib/authHelpers';

export function UserProfileButton() {
  // Simplified approach: directly use helpers without context
  const [currentUser, setCurrentUser] = useState<any>(getCurrentUser());
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Function to update user data from localStorage
    const updateUserData = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        console.log("UserProfileButton: User found:", user.name || user.email || "User");
      } else {
        console.log("UserProfileButton: No user found");
      }
    };
    
    // Initial update
    updateUserData();
    
    // Set up listeners for auth state changes
    const handleAuthChange = () => updateUserData();
    
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []); // No dependencies
  
  // Simple logout function
  const logOut = async () => {
    try {
      logout();
      return Promise.resolve();
    } catch (error) {
      console.error("Error during logout:", error);
      return Promise.reject(error);
    }
  };
  
  // Function to check admin status
  const isAdmin = () => checkIsAdmin();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setOpen(false);
      setLocation('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = () => {
    if (!currentUser) return 'U';
    
    // Handle both AuthUser format and Firebase format
    const displayName = currentUser.name || currentUser.displayName;
    if (!displayName) return 'U';
    
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <Button variant="ghost" className="h-8 w-8 rounded-full" disabled>
        <span className="sr-only">Loading profile</span>
        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
      </Button>
    );
  }

  if (!currentUser) {
    return null; // Don't render anything if not logged in
  }

  return (
    <div ref={dropdownRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {currentUser.photoURL ? (
                <AvatarImage 
                  src={currentUser.photoURL} 
                  alt={(currentUser.name || currentUser.displayName || 'User')} 
                />
              ) : (
                <AvatarFallback className="bg-primary-100 text-primary-600">
                  {getUserInitials()}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser.name || currentUser.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground text-slate-500 truncate">
                {currentUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setLocation('/profile');
            }}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setLocation('/my-properties');
            }}
          >
            My Properties
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => {
              setOpen(false);
              setLocation('/favorites');
            }}
          >
            Favorites
          </DropdownMenuItem>
          {isAdmin() && (
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                setOpen(false);
                setLocation('/admin/dashboard');
              }}
            >
              Admin Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-500 focus:text-red-500"
            onClick={handleSignOut}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}