import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HomeIcon, ChevronLeft, Construction } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-3xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary-100 rounded-full">
            <Construction className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('notFound.title')}</h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          {t('notFound.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="flex items-center gap-2 bg-primary-600 text-white">
              <HomeIcon className="h-4 w-4" />
              {t('notFound.backToHome')}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('notFound.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}
