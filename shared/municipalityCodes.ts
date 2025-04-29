// Municipality codes for Finnish cities
// Source: Statistics Finland (Tilastokeskus)
export const municipalityCodes: Record<string, string> = {
  'Helsinki': '091',
  'Espoo': '049',
  'Tampere': '837',
  'Vantaa': '092',
  'Oulu': '564',
  'Turku': '853',
  'Jyväskylä': '179',
  'Lahti': '398',
  'Kuopio': '297',
  'Pori': '609',
  'Kouvola': '286',
  'Joensuu': '167',
  'Vaasa': '905',
  'Lappeenranta': '405',
  'Hämeenlinna': '109',
  'Rovaniemi': '698',
  'Seinäjoki': '743',
  'Mikkeli': '491',
  'Kotka': '285',
  'Salo': '734'
};

// Helper function to get municipality code from city name
export function getMunicipalityCode(city: string): string {
  return municipalityCodes[city] || '';
} 