import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Stats() {
  const { t } = useLanguage();
  const stats = [
    {
      icon: "ri-home-4-line",
      value: "10K+",
      label: t('stats.propertiesListed')
    },
    {
      icon: "ri-user-3-line",
      value: "2M+",
      label: t('stats.happyCustomers')
    },
    {
      icon: "ri-building-line",
      value: "500+",
      label: t('stats.citiesCovered')
    },
    {
      icon: "ri-hand-heart-line",
      value: "99%",
      label: t('stats.customerSatisfaction')
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold font-heading mb-4">{t('stats.sectionTitle')}</h2>
          <p className="text-slate-600">{t('stats.sectionDescription')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${stat.icon} text-2xl text-primary-600`}></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
              <p className="text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
