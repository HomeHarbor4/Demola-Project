import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Building2, 
  Map, 
  LogOut,
  FileText,
  MessageSquare,
  Settings,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdmin, logout } from "@/lib/unifiedAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  
  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      // Redirect non-admin users to login
      setLocation('/signin');
    }
  }, [setLocation]);
  
  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isAdmin()) {
        setLocation('/signin');
      }
    };
    
    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [setLocation]);
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error("Error during admin logout:", error);
      setLocation('/');
    }
  };
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white hidden md:block">
        <div className="p-4">
          <h1 className="text-xl font-bold tracking-tight">HomeHarbor</h1>
          <p className="text-sm text-slate-400">Admin Panel</p>
        </div>
        
        <div className="px-4 py-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 py-2">Main</p>
            
            <NavItem 
              href="/admin" 
              icon={<LayoutDashboard className="h-4 w-4 mr-2" />}
              label="Dashboard"
              active={location === "/admin"}
            />
            
            <NavItem 
              href="/admin/properties" 
              icon={<Building2 className="h-4 w-4 mr-2" />}
              label="Properties"
              active={location === "/admin/properties"}
            />
            
            <NavItem 
              href="/admin/users" 
              icon={<Users className="h-4 w-4 mr-2" />}
              label="Users"
              active={location === "/admin/users"}
            />
            
            <NavItem 
              href="/admin/locations" 
              icon={<Map className="h-4 w-4 mr-2" />}
              label="Locations"
              active={location === "/admin/locations"}
            />

            <NavItem 
              href="/admin/neighborhoods" 
              icon={<MapPin  className="h-4 w-4 mr-2" />}
              label="Neighborhoods"
              active={location === "/admin/neighborhoods"}
            />

            <NavItem 
              href="/admin/blog" 
              icon={<MapPin  className="h-4 w-4 mr-2" />}
              label="Blog Posts"
              active={location === "/admin/blog"}
            />
            
            <p className="text-xs font-semibold text-slate-400 py-2 mt-4">Content</p>
            
            <NavItem 
              href="/admin/pages" 
              icon={<FileText className="h-4 w-4 mr-2" />}
              label="Pages"
              active={location === "/admin/pages"}
            />
            
            <NavItem 
              href="/admin/messages" 
              icon={<MessageSquare className="h-4 w-4 mr-2" />}
              label="Messages"
              active={location === "/admin/messages"}
            />
            
            <p className="text-xs font-semibold text-slate-400 py-2 mt-4">System</p>
            
            <NavItem 
              href="/admin/settings" 
              icon={<Settings className="h-4 w-4 mr-2" />}
              label="Settings"
              active={location === "/admin/settings"}
            />
            
            <NavItem 
              href="/admin/logs" 
              icon={<AlertTriangle className="h-4 w-4 mr-2" />}
              label="System Logs"
              active={location === "/admin/logs"}
            />
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/" 
              icon={<Home className="h-4 w-4 mr-2" />}
              label="Back to Site"
              active={false}
            />
            
            <div 
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm rounded-md w-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="truncate">Logout</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-50">
        {children}
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center px-3 py-2 text-sm rounded-md w-full",
        active 
          ? "bg-slate-800 text-white font-medium" 
          : "text-slate-300 hover:text-white hover:bg-slate-800"
      )}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}