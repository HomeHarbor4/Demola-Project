import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { Link } from 'wouter';

export function CallToAction() {
  const { t } = useLanguage();

  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{t('callToAction.title')}</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          {t('callToAction.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="secondary" size="lg">
            <Link to="/add-property">{t('callToAction.listProperty')}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-transparent border border-white text-white hover:bg-white hover:text-primary transition-colors"
          >
            <Link to="/properties">{t('callToAction.browseProperties')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
