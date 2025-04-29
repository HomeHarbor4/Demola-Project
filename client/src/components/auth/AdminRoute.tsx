import React, { useState, useEffect } from 'react';
import { useLocation, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { isAdmin } from '@/lib/authHelpers';

interface AdminRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ component: Component, ...rest }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Check if the user is an admin
    const checkAdmin = () => {
      const adminStatus = isAdmin();
      setAuthorized(adminStatus);
      setLoading(false);
    };
    
    // Short delay to ensure localStorage is checked
    const timer = setTimeout(checkAdmin, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    // Redirect to simple admin login
    return <Redirect to="/admin/login" />;
  }

  return <Component {...rest} />;
};