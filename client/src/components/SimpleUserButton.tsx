// c:\Users\admin\Downloads\RealEstateSync\client\src\components\SimpleUserButton.tsx

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
// Import useAuth hook and logout function from AuthContext/unifiedAuth
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin as checkIsAdmin } from '@/lib/unifiedAuth'; // Keep helper for admin check if needed
import { useLanguage } from '@/contexts/LanguageContext';

export function SimpleUserButton() {
  const { t } = useLanguage();
  // --- Use AuthContext for user state ---
  const { user, logout } = useAuth();
  // --- Remove local state management for currentUser ---
  // const [currentUser, setCurrentUser] = useState<any>(getCurrentUser());

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // --- Remove useEffect that manually syncs state ---
  // useEffect(() => { ... handleAuthChange ... }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent default link behavior if wrapped in <a>
    setOpen(false);
    console.log('SUB: Starting sign out process');
    try {
      await logout(); // Use logout from AuthContext
      console.log('SUB: Logout completed, reloading page');
      // Redirect or reload after logout is handled by AuthContext/unifiedAuth potentially
      window.location.href = '/'; // Force reload if needed
    } catch (error) {
      console.error('SUB ERROR: Error during logout:', error);
      // Attempt emergency cleanup if needed, though context should handle it
      localStorage.removeItem('currentUser'); // Use correct key if different
      window.location.href = '/';
    }
  };

  // Function to check admin status (can use user from context)
  const isAdmin = () => {
    return !!user && user.role === 'admin';
    // Or keep using checkIsAdmin() if it reads from localStorage reliably,
    // but using context state is generally better.
    // return checkIsAdmin();
  };

  const getUserInitials = () => {
    // Use user from context
    if (!user) return 'U';
    const displayName = user.name || 'User'; // Simplify fallback
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0]?.[0]?.toUpperCase() || 'U'; // Safer access
  };

  // If no user from context, render nothing
  if (!user) {
    return null;
  }

  // Use 'user' directly from useAuth() hook
  return (
    <div ref={dropdownRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {/* Check user.photoURL from context */}
              {user.photoURL && user.photoURL !== '' ? (
                <AvatarImage
                  src={user.photoURL}
                  alt={user.name || t('navbar.profile')}
                  // Optional: Add onError to see if image fails loading
                  onError={(e) => console.error('AvatarImage Error:', e, 'URL:', user.photoURL)}
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
              {/* Use user from context */}
              <p className="text-sm font-medium leading-none">{user.name || t('navbar.profile')}</p>
              <p className="text-xs leading-none text-muted-foreground text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Use Link component for navigation */}
          <DropdownMenuItem onSelect={() => setLocation('/profile')} className="cursor-pointer">
            {t('navbar.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLocation('/my-properties')} className="cursor-pointer">
            {t('navbar.myProperties')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLocation('/favorites')} className="cursor-pointer">
            {t('navbar.myFavorites')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLocation('/messages')} className="cursor-pointer">
            {t('navbar.myMessages')}
          </DropdownMenuItem>
          {isAdmin() && (
            <DropdownMenuItem onSelect={() => setLocation('/admin/dashboard')} className="cursor-pointer">
              {t('navbar.adminDashboard')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* Use onSelect for actions within DropdownMenuItem */}
          <DropdownMenuItem
            onSelect={handleSignOut}
            className="cursor-pointer text-red-500 focus:text-red-500"
          >
            {t('navbar.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
