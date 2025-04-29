export const countries = [
  { name: "Finland", code: "FI" },
  { name: "Sweden", code: "SE" },
  { name: "Norway", code: "NO" },
  { name: "Denmark", code: "DK" },
  { name: "Estonia", code: "EE" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Spain", code: "ES" },
  { name: "Italy", code: "IT" },
  { name: "Netherlands", code: "NL" },
  { name: "United Kingdom", code: "GB" },
];

export const currencies = [
  { label: "Euro", value: "EUR", symbol: "€" },
  { label: "US Dollar", value: "USD", symbol: "$" },
  { label: "British Pound", value: "GBP", symbol: "£" },
  { label: "Swedish Krona", value: "SEK", symbol: "kr" },
  { label: "Norwegian Krone", value: "NOK", symbol: "kr" },
  { label: "Danish Krone", value: "DKK", symbol: "kr" },
];

export const countryToCurrency = {
  "Finland": "EUR",
  "Sweden": "SEK",
  "Norway": "NOK",
  "Denmark": "DKK",
  "Estonia": "EUR",
  "Germany": "EUR",
  "France": "EUR",
  "Spain": "EUR",
  "Italy": "EUR",
  "Netherlands": "EUR",
  "United Kingdom": "GBP",
};

export const propertyTypes = [
  "Apartment",
  "House",
  "Villa",
  "Townhouse",
  "Cottage",
  "Duplex",
  "Studio",
  "Penthouse",
  "Commercial",
  "Office",
  "Retail",
  "Industrial",
  "Land",
];

export const listingTypes = [
  "For Sale",
  "For Rent",
  "Short Term",
  "Commercial",
];

export function generateCityNames(country: string, count: number): string[] {
  const citiesMap: Record<string, string[]> = {
    "Finland": [
      "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", 
      "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Vaasa", "Lappeenranta", 
      "Hämeenlinna", "Rovaniemi", "Seinäjoki", "Mikkeli", "Kotka", "Salo"
    ],
    "Sweden": [
      "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", 
      "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", 
      "Södertälje", "Eskilstuna", "Halmstad", "Växjö", "Karlstad", "Sundsvall"
    ],
    "Norway": [
      "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", 
      "Sandnes", "Tromsø", "Sarpsborg", "Skien", "Ålesund", "Sandefjord", "Haugesund", 
      "Tønsberg", "Moss", "Porsgrunn", "Bodø", "Arendal", "Hamar"
    ],
    "Denmark": [
      "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", 
      "Horsens", "Vejle", "Roskilde", "Herning", "Helsingør", "Silkeborg", "Næstved", 
      "Fredericia", "Viborg", "Køge", "Holstebro", "Taastrup", "Slagelse"
    ],
    "Germany": [
      "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", 
      "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg", 
      "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"
    ],
    "France": [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", 
      "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", 
      "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
    ],
    "United Kingdom": [
      "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Bristol", "Sheffield", 
      "Leeds", "Edinburgh", "Leicester", "Coventry", "Bradford", "Cardiff", "Belfast", 
      "Nottingham", "Hull", "Newcastle", "Stoke-on-Trent", "Southampton", "Derby"
    ],
    "Spain": [
      "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", 
      "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", 
      "Gijón", "L'Hospitalet", "Vitoria-Gasteiz", "Granada", "Elche", "Oviedo"
    ],
    "Italy": [
      "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", 
      "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", 
      "Brescia", "Parma", "Taranto", "Prato", "Modena"
    ],
    "Netherlands": [
      "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", 
      "Almere", "Breda", "Nijmegen", "Enschede", "Haarlem", "Arnhem", "Zaanstad", 
      "Amersfoort", "Apeldoorn", "'s-Hertogenbosch", "Hoofddorp", "Maastricht", "Leiden"
    ],
    "Estonia": [
      "Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", 
      "Maardu", "Sillamäe", "Võru", "Kuressaare", "Valga", "Jõhvi", "Haapsalu", 
      "Keila", "Paide", "Tapa", "Põlva", "Kiviõli", "Elva"
    ],
  };

  const defaultCities = [
    "Central City", "Riverside", "Oakwood", "Pinehurst", "Maple Grove", 
    "Westfield", "Northbridge", "Southport", "Eastland", "Woodlands",
    "Brighton", "Fairview", "Highpoint", "Lakeview", "Sunset Valley",
    "Meadowbrook", "Greenfield", "Stonehaven", "Brookside", "Highland Park"
  ];

  // Get cities for the specified country, or use default cities
  const cities = citiesMap[country] || defaultCities;
  
  // Ensure we don't request more cities than are available
  const actualCount = Math.min(count, cities.length);
  
  // Create a shuffled copy of the cities array
  const shuffled = [...cities].sort(() => 0.5 - Math.random());
  
  // Return the first 'count' cities
  return shuffled.slice(0, actualCount);
}