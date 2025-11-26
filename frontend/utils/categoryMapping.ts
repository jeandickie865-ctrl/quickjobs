// utils/categoryMapping.ts - Kategorie → Tätigkeiten & Qualifikationen Mapping

export type CategoryKey = 
  | 'delivery'
  | 'gastro'
  | 'logistics'
  | 'events'
  | 'promotion'
  | 'security'
  | 'home'
  | 'cleaning'
  | 'childcare'
  | 'elderly'
  | 'tutoring'
  | 'office'
  | 'inventory';

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  skills: string[];
}

export const CATEGORIES: Category[] = [
  {
    key: 'delivery',
    label: 'Lieferservice & Kurier',
    icon: 'bicycle',
    skills: [
      'Essenslieferung',
      'Paketlieferung',
      'Kurierfahrten Auto',
      'Kurierfahrten Roller/Moped',
      'Kurierfahrten Fahrrad',
      'Eigener PKW',
      'Eigenes Fahrrad',
      'E-Scooter',
      'Transporter',
      'Führerschein Klasse B',
      'Körperlich belastbar',
    ],
  },
  {
    key: 'gastro',
    label: 'Gastronomie & Service',
    icon: 'restaurant',
    skills: [
      'Servicekraft',
      'Kellner',
      'Theke',
      'Bar',
      'Getränke',
      'Buffet',
      'Ausgabe',
      'Küche',
      'Spülkraft',
      'Koch/Köchin',
      'Gastro Erfahrung',
      'Gesundheitspass',
      'Freundliches Auftreten',
      'Deutsch mind. B1',
    ],
  },
  {
    key: 'logistics',
    label: 'Lager & Logistik',
    icon: 'cube',
    skills: [
      'Kommissionieren',
      'Verpackung',
      'Warenannahme',
      'Warenversand',
      'Staplerfahren',
      'Staplerschein',
      'Inventur',
      'Zählen',
      'Schichtbereitschaft',
      'Teamfähigkeit',
      'Grundkenntnisse Deutsch',
    ],
  },
  {
    key: 'events',
    label: 'Event & Messe',
    icon: 'calendar',
    skills: [
      'Auf- und Abbau',
      'Garderobe',
      'Host/Hostess',
      'Event-Service',
      'Kasse',
      'Promoter',
      'Messebau',
      'Einlass',
      'Dekoration',
      'Standbetreuung',
    ],
  },
  {
    key: 'promotion',
    label: 'Promotion & Verkauf',
    icon: 'pricetag',
    skills: [
      'Flyer verteilen',
      'Kundenansprache',
      'Verkauf',
      'Kasse',
      'Produktdemo',
      'Samples verteilen',
      'Markenbotschafter',
      'Deutsch B1/B2',
    ],
  },
  {
    key: 'security',
    label: 'Sicherheit',
    icon: 'shield',
    skills: [
      'Einlasskontrolle',
      'Veranstaltungsschutz',
      'Objektschutz',
      'Revierdienst',
      'Kaufhausdetektiv',
      'Parkplatzaufsicht',
      '34a Unterrichtung',
      '34a Sachkunde',
      'Bewacher-ID',
      'Führungszeugnis',
      'Nachtschicht',
      'Deutsch mind. B1',
      'Teamfähigkeit',
      'Stressresistenz',
    ],
  },
  {
    key: 'home',
    label: 'Haus & Garten',
    icon: 'home',
    skills: [
      'Rasen mähen',
      'Hecke schneiden',
      'Handwerk',
      'Haushaltshilfe',
      'Möbel aufbauen',
      'Umzugshilfe',
      'Gartenarbeit',
      'Keller räumen',
    ],
  },
  {
    key: 'cleaning',
    label: 'Reinigung',
    icon: 'water',
    skills: [
      'Putzen',
      'Unterhaltsreinigung',
      'Büroreinigung',
      'Fensterreinigung',
      'Bodenreinigung',
      'Hygiene-Grundkenntnisse',
      'Desinfektion',
    ],
  },
  {
    key: 'childcare',
    label: 'Kinderbetreuung',
    icon: 'happy',
    skills: [
      'Babysitten',
      'Hausaufgabenhilfe',
      'Kinder abholen',
      'Erfahrung mit Kindern',
      'Erste-Hilfe Kind',
      'Polizeiliches Führungszeugnis',
    ],
  },
  {
    key: 'elderly',
    label: 'Seniorenhilfe & Alltagshilfe',
    icon: 'heart',
    skills: [
      'Begleitung',
      'Einkaufen',
      'Haushalt',
      'Spaziergänge',
      'Grundpflege-Erfahrung',
      'Erste Hilfe',
    ],
  },
  {
    key: 'tutoring',
    label: 'Nachhilfe & Unterricht',
    icon: 'book',
    skills: [
      'Mathe',
      'Deutsch',
      'Englisch',
      'Französisch',
      'Physik',
      'Chemie',
      'Grundschule',
      'Abitur-Vorbereitung',
      'Geduld',
      'Didaktik-Grundwissen',
    ],
  },
  {
    key: 'office',
    label: 'Büro & Kundenservice',
    icon: 'briefcase',
    skills: [
      'Telefonservice',
      'E-Mail-Kommunikation',
      'Datenpflege',
      'Kasse',
      'Terminvergabe',
      'Empfang',
      'PC-Kenntnisse',
      'Office-Grundlagen',
    ],
  },
  {
    key: 'inventory',
    label: 'Inventur & Zähljobs',
    icon: 'list',
    skills: [
      'Inventur',
      'Zahlen',
      'Barcode scannen',
      'Regale ordnen',
      'Nachtbereitschaft',
      'Logistikgrundlagen',
    ],
  },
];

export const getCategoryByKey = (key: CategoryKey): Category | undefined => {
  return CATEGORIES.find(cat => cat.key === key);
};

export const getSkillsForCategories = (categoryKeys: CategoryKey[]): string[] => {
  const allSkills = categoryKeys.flatMap(key => {
    const cat = getCategoryByKey(key);
    return cat ? cat.skills : [];
  });
  // Remove duplicates
  return Array.from(new Set(allSkills));
};

// Object mapping for backward compatibility
export const CATEGORY_MAPPING: Record<string, Category> = CATEGORIES.reduce((acc, cat) => {
  acc[cat.label] = cat;
  return acc;
}, {} as Record<string, Category>);
