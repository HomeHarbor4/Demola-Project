// src/components/Footer.tsx
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

// --- Define the FooterContent type based on the database schema ---
interface FooterContent {
  id: number;
  title: string;
  link: string | null;
  section: string; // e.g., 'company', 'legal', 'social', 'resources', 'contact', 'bottom'
  icon: string | null;
  active: boolean;
  position: number;
  openInNewTab: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Define FooterLink Props ---
type FooterLinkProps = {
  href: string;
  openInNewTab?: boolean;
  icon?: string | null;
  children: React.ReactNode;
};

// --- FooterLink Component Implementation ---
const FooterLink = ({ href, openInNewTab = false, icon, children }: FooterLinkProps) => {
  return (
    <li>
      <Link href={href} target={openInNewTab ? '_blank' : '_self'} rel={openInNewTab ? 'noopener noreferrer' : ''}>
        <span className="flex items-center text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">
          {icon && <i className={`${icon} mr-2`}></i>}
          {children}
        </span>
      </Link>
    </li>
  );
};

// --- Function to group footer contents by section ---
function groupFooterContentsBySection(contents: FooterContent[]): Record<string, FooterContent[]> {
  const grouped: Record<string, FooterContent[]> = {};
  for (const item of contents) {
    if (!grouped[item.section]) {
      grouped[item.section] = [];
    }
    grouped[item.section].push(item);
    // Sorting is already done before calling this function in useEffect
  }
  return grouped;
}


export default function Footer() {
  const { t } = useLanguage(); // Use the language hook
  const [groupedContent, setGroupedContent] = useState<Record<string, FooterContent[]>>({});
  const { settings } = useSiteSettings();

  // Fetch all footer content items
  const { data: footerContents, isLoading, error } = useQuery<FooterContent[]>({
    queryKey: ['/footer'],
    queryFn: () => apiRequest<FooterContent[]>('GET', '/footer'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Process and group the data once it's loaded or changes
  useEffect(() => {
    if (footerContents && footerContents.length > 0) {
      const activeAndSorted = footerContents
        .filter(content => content.active) // Filter active items
        .sort((a, b) => a.position - b.position); // Sort by position

      const grouped = groupFooterContentsBySection(activeAndSorted);
      setGroupedContent(grouped);
    } else {
      // If no data or empty array, reset grouped content
      setGroupedContent({});
    }
  }, [footerContents]); // Re-run when footerContents data changes

  // Helper function to render a specific section
  const renderSection = (sectionName: string, titleKey: string) => {
    // Safely access the section, default to empty array if not found
    const contentItems = groupedContent[sectionName] || [];
    const title = t(`footer.${titleKey}`); // Translate title using i18n key

    return (
      <div>
        <h5 className="font-semibold text-lg mb-4">{title}</h5>
        {isLoading ? (
          // Show skeletons while loading
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-3/4 bg-slate-700" />)}
          </div>
        ) : error ? (
          // Show error message
           <p className="text-red-400 text-sm">{t('footer.errorLoading')}</p>
        ) : contentItems.length > 0 ? (
          // Render links if items exist
          <ul className="space-y-2">
            {contentItems.map((item) => (
              <FooterLink
                key={item.id}
                href={item.link || '#'} // Use '#' as fallback link
                openInNewTab={item.openInNewTab}
                icon={item.icon}
              >
                {item.title} {/* Title from DB */}
              </FooterLink>
            ))}
          </ul>
        ) : (
          // Show "Coming Soon" if no items and not loading/error
          <p className="text-slate-500 text-sm">{t('footer.comingSoon')}</p>
        )}
      </div>
    );
  };

  // Safely get social links (will be an empty array if 'social' section doesn't exist or has no active items)
  const socialLinks = groupedContent['social'] || [];
  const currentYear = new Date().getFullYear();
  const brandName = settings.brandName || "HomeHarbor"; // Fallback brand name

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info Column */}
          <div className="lg:col-span-2">
            <Link href="/">
              <span className="flex items-center mb-4 cursor-pointer">
                {/* Optional: Use an image logo from settings if available */}
                {settings.logoUrl ? (
                   <img src={settings.logoUrl} alt={brandName} className="h-8 mr-2" />
                ) : (
                   <i className="ri-home-4-line text-primary-500 text-2xl mr-2"></i>
                )}
                <span className="text-xl font-bold font-heading">{brandName}</span>
              </span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-md">
              {/* Use site description from settings or fallback translation */}
              {settings.siteDescription || t('footer.brandDescription')}
            </p>
            {/* Social Links Section */}
            {!isLoading && socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.link || '#'}
                    target={social.openInNewTab ? "_blank" : "_self"}
                    rel={social.openInNewTab ? "noopener noreferrer" : ""}
                    className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-primary-600 transition"
                    aria-label={social.title} // Accessibility label
                  >
                    {/* Render icon using Remix Icon class */}
                    <i className={`${social.icon || "ri-link"} text-xl`}></i>
                  </a>
                ))}
              </div>
            )}
             {/* Skeleton for social links */}
             {isLoading && (
                <div className="flex space-x-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-10 rounded-full bg-slate-700" />)}
                </div>
             )}
          </div>

          {/* Dynamic Footer Link Sections */}
          {renderSection('company', 'company')}
          {renderSection('resources', 'resources')}
          {/* {renderSection('contact', 'contact')} */} {/* Example: Uncomment if you have a 'contact' section */}
          {renderSection('legal', 'legal')}
        </div>

        {/* Optional Sections (Example: Languages, App Stores, Payment Methods) */}
        {/* Conditionally render these based on whether the sections exist in groupedContent */}
        {/*
        {(groupedContent['languages']?.length > 0 || groupedContent['apps']?.length > 0 || groupedContent['payment']?.length > 0) && (
          <div className="border-t border-slate-800 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {groupedContent['languages']?.length > 0 && renderSection('languages', 'languages')}
              {groupedContent['apps']?.length > 0 && renderSection('apps', 'apps')}
              {groupedContent['payment']?.length > 0 && renderSection('payment', 'payment')}
            </div>
          </div>
        )}
        */}

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-slate-800 pt-6">
          <p className="text-slate-400 text-sm mb-4 md:mb-0">
            {/* Use copyright from settings or fallback translation */}
            {settings.footerCopyright || t('footer.copyright', { year: currentYear, brandName: brandName })}
          </p>
          {/* Bottom Links (e.g., Privacy Policy, Terms) */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
             {isLoading ? (
                <div className="flex gap-6">
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                    <Skeleton className="h-4 w-20 bg-slate-700" />
                </div>
             ) : (
                (groupedContent['bottom'] || []).map((item) => (
                    <Link key={item.id} href={item.link || '#'}>
                      <span className="text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">{item.title}</span>
                    </Link>
                ))
             )}
            {/* Optional Admin Link */}
            {settings.showAdminInFooter && !isLoading && (
              <Link href="/admin/login">
                <span className="text-slate-500 hover:text-white text-sm cursor-pointer transition-colors">{t('footer.admin')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
