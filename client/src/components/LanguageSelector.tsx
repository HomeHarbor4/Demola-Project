// src/components/LanguageSelector.tsx
import { useState } from 'react';
import { useLanguage, languageOptions, SupportedLanguage } from '@/contexts/LanguageContext'; // Import from LanguageContext
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage(); // Use hook from LanguageContext
  const [open, setOpen] = useState(false);

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang); // Use setLanguage from context
    setOpen(false);
  };

  // Get the current language display name
  const currentLanguageLabel = languageOptions.find(option => option.value === language)?.label || 'English';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 px-2 text-sm font-medium text-inherit hover:bg-white/10"
        >
          <span className="hidden md:inline">{currentLanguageLabel}</span>
          <span className="md:hidden">{language.toUpperCase()}</span>
          <i className="ri-global-line ml-1"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={language === option.value ? 'bg-slate-100 text-primary-600 font-medium' : ''}
            onClick={() => handleSelectLanguage(option.value as SupportedLanguage)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
