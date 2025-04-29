// src/components/Navbar.tsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SimpleUserButton } from "./SimpleUserButton"; // Assumes this uses useLanguage internally or takes t as prop
import { LanguageSelector } from "./LanguageSelector"; // Assumes this uses useLanguage internally
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

// --- Navigation Link Types ---
interface NavItem {
  href: string;
  labelKey: string; // Key for translation
  icon?: string;
}

// --- Define Navigation Links (using keys) ---
const mainNavLinks: NavItem[] = [
  { href: "/properties?listingType=buy", labelKey: "buy" },
  { href: "/properties?listingType=rent", labelKey: "rent" },
  { href: "/properties?listingType=sell", labelKey: "sell" },
  { href: "/properties?listingType=commercial", labelKey: "commercial" },
  { href: "/properties?listingType=pg", labelKey: "pg" },
  { href: "/agents", labelKey: "findAgents" },
];

const secondaryNavLinks: NavItem[] = [
  { href: "/neighborhoods", labelKey: "neighborhoods" },
  { href: "/mortgage", labelKey: "mortgage" },
  { href: "/blog", labelKey: "blog" },
];

const userNavLinks: NavItem[] = [
   { href: "/profile", labelKey: "profile", icon: "ri-user-settings-line" },
   { href: "/my-properties", labelKey: "myProperties", icon: "ri-building-line" },
   { href: "/favorites", labelKey: "myFavorites", icon: "ri-heart-line" },
   { href: "/messages", labelKey: "myMessages", icon: "ri-message-2-line" },
];

const adminNavLink: NavItem = { href: "/admin/dashboard", labelKey: "adminDashboard", icon: "ri-dashboard-line" };

// --- NavLink Component ---
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const NavLink = ({ href, children, className = "", onClick }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href ||
                   (href.startsWith('/properties?') && location.startsWith('/properties')) ||
                   (href !== '/' && location.startsWith(href) && href.split('?')[0] === location.split('?')[0]);

  // Handle property type links differently
  const handleClick = (e: React.MouseEvent) => {
    if (href.startsWith('/properties?listingType=')) {
      e.preventDefault();
      window.location.href = href;
    }
    onClick?.();
  };

  return (
    <Link href={href} onClick={handleClick}>
      <span
        className={`text-sm font-medium transition cursor-pointer ${
          isActive ? 'text-primary-600' : 'text-slate-700 hover:text-primary-600'
        } ${className}`}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </span>
    </Link>
  );
};

// --- Mobile NavLink Component ---
interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
};

const MobileNavLink = ({ href, children, icon, onClick }: MobileNavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href || (href !== '/' && location.startsWith(href));

  return (
    <Link href={href} onClick={onClick}>
      <span
        className={`flex items-center w-full px-4 py-3 rounded-md text-base font-medium transition ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        {icon && <i className={`${icon} mr-3 text-lg w-5 text-center`}></i>}
        <span>{children}</span>
      </span>
    </Link>
  );
};


// --- Main Navbar Component ---
export default function Navbar() {
  const { t } = useLanguage(); // Use the hook
  const { user, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const [, navigate] = useLocation();

  // --- Logout Function ---
  const handleSignOut = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsMobileMenuOpen(false);
    try {
      await logout();
      window.location.href = "/"; // Force reload
    } catch (error) {
      console.error("NAVBAR LOGOUT ERROR:", error);
      navigate("/");
    }
  };

  // --- Get User Initials ---
  const getUserInitials = () => {
    if (!user) return "U";
    const displayName = user.name || user.displayName;
    if (!displayName) return user.email?.[0]?.toUpperCase() ?? "U";
    const nameParts = displayName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  // --- Render ---
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="bg-slate-800 text-white py-1.5 text-xs">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {settings.contactPhone && (
              <a href={`tel:${settings.contactPhone}`} className="flex items-center hover:text-primary-300 transition-colors">
                <i className="ri-phone-line mr-1"></i> {settings.contactPhone}
              </a>
            )}
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="flex items-center hover:text-primary-300 transition-colors">
                <i className="ri-mail-line mr-1"></i> {settings.contactEmail}
              </a>
            )}
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 mr-4">
            <i className="ri-home-4-line text-primary-600 text-2xl"></i>
            <span className="text-xl font-bold font-heading text-primary-600">
              {settings.brandName || "HomeHarbor"} {/* Dynamic */}
            </span>
          </Link>
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-6">
            {mainNavLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>{t(`navbar.${link.labelKey}`)}</NavLink>
            ))}
            <NavLink href="/mortgage">{t('navbar.mortgage')}</NavLink>
            <NavLink href="/neighborhoods">{t('navbar.neighborhoods')}</NavLink>
            <NavLink href="/blog">{t('navbar.blog')}</NavLink>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoading && user && (
              <Link href="/add-property">
                <Button variant="outline" size="sm">
                  <i className="ri-add-line mr-1.5"></i> {t('navbar.listProperty')}
                </Button>
              </Link>
            )}
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
            ) : user ? (
              <SimpleUserButton />
            ) : (
              <>
                <Link href="/signin">
                  <Button size="sm">
                    <i className="ri-user-line mr-1.5"></i> {t('navbar.signIn')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" size="sm">
                    {t('navbar.signUp')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('navbar.menu')}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm p-0 flex flex-col">
              <SheetHeader className="p-6 border-b">
                <div className="flex justify-between items-center">
                   <SheetTitle className="text-lg font-semibold">{t('navbar.menu')}</SheetTitle>
                   <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label={t('close')}>
                      <X className="h-5 w-5" />
                   </Button>
                </div>
              </SheetHeader>

              <div className="flex-grow overflow-y-auto p-4 space-y-1">
                {/* User Info */}
                {user && (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                      <Avatar className="h-10 w-10">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name || "User"} />}
                        <AvatarFallback className="bg-primary-100 text-primary-600">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.name || user.displayName || "User"}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</div>
                      </div>
                    </div>
                    {userNavLinks.map((link) => (
                       <MobileNavLink key={link.href} href={link.href} icon={link.icon} onClick={() => setIsMobileMenuOpen(false)}>
                          {t(`navbar.${link.labelKey}`)}
                       </MobileNavLink>
                    ))}
                    {user?.role === 'admin' && (
                       <MobileNavLink href={adminNavLink.href} icon={adminNavLink.icon} onClick={() => setIsMobileMenuOpen(false)}>
                          {t(`navbar.${adminNavLink.labelKey}`)}
                       </MobileNavLink>
                    )}
                    <Separator className="my-2" />
                  </>
                )}

                {/* Main Navigation Links */}
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase">{t('navbar.explore')}</p>
                {mainNavLinks.map((link) => (
                  <MobileNavLink key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    {t(`navbar.${link.labelKey}`)}
                  </MobileNavLink>
                ))}
                 {secondaryNavLinks.map((link) => (
                  <MobileNavLink key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    {t(`navbar.${link.labelKey}`)}
                  </MobileNavLink>
                ))}

                <Separator className="my-2" />

                {/* Actions */}
                <div className="px-4 py-2 space-y-3">
                {!isLoading && user && (
                  <Link href="/add-property" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-center" variant="outline">
                      <i className="ri-add-line mr-1.5"></i> {t('navbar.listProperty')}
                    </Button>
                  </Link>
                  )}
                  {!user && !isLoading && (
                    <>
                      <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-center">
                          <i className="ri-user-line mr-1.5"></i> {t('navbar.signIn')}
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-center" variant="ghost">
                          <i className="ri-user-add-line mr-1.5"></i> {t('navbar.signUp')}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                {user && <Separator className="my-2" />}

              </div>

              <SheetFooter className="p-4 border-t">
                 {user ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      <i className="ri-logout-box-line mr-3 text-lg w-5 text-center"></i> {t('navbar.signOut')}
                    </Button>
                 ) : (
                    <div className="text-center text-xs text-slate-500">
                       {t('navbar.signInPrompt')}
                    </div>
                 )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
