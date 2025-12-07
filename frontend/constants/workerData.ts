export type CategoryKey = 
  | "lieferservice"
  | "gastronomie"
  | "lager_logistik"
  | "event_messe"
  | "promotion_verkauf"
  | "sicherheit"
  | "haus_garten"
  | "reinigung"
  | "kinderbetreuung"
  | "seniorenhilfe"
  | "nachhilfe_unterricht"
  | "buero_kundenservice"
  | "inventur"
  | "friseur"
  | "kosmetik"
  | "dj"
  | "ton"
  | "stage";

export type TaxonomyCategory = {
  key: CategoryKey;
  title: string;
  activities: string[];
  qualifications: string[];
};

export const TAXONOMY: TaxonomyCategory[] = [
  {
    key: "lieferservice",
    title: "Lieferservice & Kurier",
    activities: [
      "Essenslieferung",
      "Paketlieferung",
      "Kurierfahrten Auto",
      "Kurierfahrten Fahrrad",
      "Kurierfahrten Roller / Moped",
      "Navigation & Orientierung",
      "Pakethandling",
      "Kundenkontakt Lieferung",
    ],
    qualifications: [
      "Führerschein Klasse B",
      "Führerschein AM",
      "Führerschein A1",
      "eigener Pkw",
      "eigenes Fahrrad",
      "eigener Roller / Moped",
      "eigenes E-Bike",
      "eigener 125ccm",
      "eigener Transporter",
    ],
  },
  {
    key: "gastronomie",
    title: "Gastronomie & Service",
    activities: [
      "Servicekraft / Kellner",
      "Thekenkraft",
      "Bar / Getränke",
      "Küchenhilfe",
      "Spülkraft",
      "Koch / Köchin",
      "Buffet / Ausgabe",
      "Kasse im Restaurant",
    ],
    qualifications: [
      "Erfahrung im Service",
      "Erfahrung in der Küche",
      "Kassenerfahrung",
      "Gesundheitsausweis / Hygieneschulung",
      "Deutsch mind. B1",
      "weitere Sprache",
    ],
  },
  {
    key: "lager_logistik",
    title: "Lager & Logistik",
    activities: [
      "Kommissionierung",
      "Wareneingang / Warenausgang",
      "Verpackung",
      "Versandvorbereitung",
      "Stapler fahren",
    ],
    qualifications: [
      "Staplerschein",
      "Erfahrung mit Handscanner",
      "körperlich belastbar",
    ],
  },
  {
    key: "event_messe",
    title: "Event & Messe",
    activities: [
      "Auf- und Abbau",
      "Stagehand",
      "Garderobe",
      "Einlasskontrolle (ohne Security-Funktion)",
      "Getränkeverkauf",
      "Imbiss / Foodtruck",
      "Messehost / Hostess",
      "Kassenkraft Event",
    ],
    qualifications: [
      "Event-Erfahrung",
      "Gastro-Erfahrung",
      "Erfahrung Kasse",
      "Deutsch mind. B1",
      "gepflegtes Auftreten",
    ],
  },
  {
    key: "promotion_verkauf",
    title: "Promotion & Verkauf",
    activities: [
      "Promo-Stand betreuen",
      "Flyer verteilen",
      "Produkt-Sampling",
      "Produktberatung im Laden",
      "Verkauf im Shop",
      "Telefonischer Kundenservice (leichte Tätigkeiten)",
    ],
    qualifications: [
      "Verkaufserfahrung",
      "Promotion-Erfahrung",
      "Kassenerfahrung",
      "Deutsch mind. B2",
      "weitere Sprache",
    ],
  },
  {
    key: "sicherheit",
    title: "Sicherheit",
    activities: [
      "Einlasskontrolle mit 34a",
      "Veranstaltungsschutz",
      "Objektschutz",
      "Revierdienst",
      "Kaufhausdetektiv",
      "Parkplatzaufsicht",
    ],
    qualifications: [
      "Sachkunde nach § 34a GewO",
      "Unterrichtung nach § 34a GewO",
      "Bewacher-ID",
      "Polizeiliches Führungszeugnis",
      "Erfahrung im Sicherheitsdienst",
      "Deutsch mind. B1",
      "Nachtschicht-Bereitschaft",
      "Führerschein Klasse B",
    ],
  },
  {
    key: "haus_garten",
    title: "Haus & Garten",
    activities: [
      "Rasen mähen",
      "Hecke schneiden",
      "Unkraut entfernen",
      "Laubarbeiten",
      "einfache Malerarbeiten",
      "Möbel aufbauen",
      "Bilder / Regale montieren",
      "Umzugshilfe",
      "Entrümpelung",
    ],
    qualifications: [
      "Erfahrung Haus & Garten",
      "Umgang mit Werkzeug",
      "körperlich belastbar",
      "eigener Pkw / Transporter",
    ],
  },
  {
    key: "reinigung",
    title: "Reinigung",
    activities: [
      "Haushaltsreinigung",
      "Büroreinigung",
      "Treppenhausreinigung",
      "Fensterreinigung",
      "Endreinigung / Auszug",
    ],
    qualifications: [
      "Erfahrung in der Reinigung",
      "Umgang mit Reinigungsmitteln",
    ],
  },
  {
    key: "kinderbetreuung",
    title: "Kinderbetreuung",
    activities: [
      "Babysitting",
      "Kinderbetreuung zu Hause",
      "Hausaufgabenbetreuung",
      "Fahrdienst für Kinder",
      "Ferienbetreuung",
    ],
    qualifications: [
      "Erfahrung mit Kindern",
      "Babysitterkurs / pädagogische Erfahrung",
      "Erste Hilfe am Kind",
      "polizeiliches Führungszeugnis",
      "eigener Pkw (für Fahrdienst)",
    ],
  },
  {
    key: "seniorenhilfe",
    title: "Seniorenhilfe & Alltagshilfe",
    activities: [
      "Einkaufen gehen",
      "Begleitung zu Terminen",
      "Haushaltshilfe",
      "Gespräche / Gesellschaft",
      "leichte Unterstützung im Alltag",
    ],
    qualifications: [
      "Erfahrung mit älteren Menschen",
      "ruhiges Auftreten",
      "Deutsch mind. B1",
    ],
  },
  {
    key: "nachhilfe_unterricht",
    title: "Nachhilfe & Unterricht",
    activities: [
      "Nachhilfe Mathe",
      "Nachhilfe Deutsch",
      "Nachhilfe Englisch",
      "Nachhilfe weitere Fächer",
      "Sprachunterricht",
      "Musikunterricht",
    ],
    qualifications: [
      "Nachhilfe-Erfahrung",
      "Pädagogische Erfahrung",
      "Fach Mathe",
      "Fach Englisch",
      "Fach Deutsch",
      "Fach Physik",
      "Fach Chemie",
      "Fach Biologie",
      "Geduldig",
      "Kommunikativ",
      "Strukturiert",
    ],
  },
  {
    key: "buero_kundenservice",
    title: "Büro & Kundenservice",
    activities: [
      "Datenerfassung",
      "einfache Sachbearbeitung",
      "Empfang",
      "Telefonservice / Kundenhotline",
      "E-Mail-Support",
      "Terminorganisation",
    ],
    qualifications: [
      "Computerkenntnisse (Office)",
      "sicher an der Tastatur",
      "Deutsch mind. B2",
      "weitere Sprache",
    ],
  },
  {
    key: "inventur",
    title: "Inventur & Zähljobs",
    activities: [
      "Inventur im Supermarkt",
      "Inventur im Lager",
      "Inventur im Modegeschäft / Einzelhandel",
      "Mindesthaltbarkeitskontrolle",
      "Preisetiketten prüfen",
    ],
    qualifications: [
      "Scanner-Erfahrung",
      "Inventur-Erfahrung",
      "Zahlen-Affinität",
      "Körperlich belastbar",
    ],
  },
  {
    key: "friseur",
    title: "Friseur",
    activities: [
      "Damenfriseur",
      "Herrenfriseur",
      "Colorist",
      "Balayage Spezialist",
      "Blond-Experte",
      "Extensions Stylist",
      "Brautstyling",
      "Barbier",
    ],
    qualifications: [
      "Ausbildung Friseur",
      "Meisterbrief",
      "Colorationskenntnisse",
      "Schnitttechniken für Damen",
      "Schnitttechniken für Herren",
      "Rasurtechniken",
      "Styling für Hochzeiten",
      "Kenntnisse in Haar- und Kopfhautpflege",
      "Produktschulungen",
      "Bonding",
      "Tape-In",
      "Tressen",
    ],
  },
  {
    key: "kosmetik",
    title: "Kosmetik",
    activities: [
      "Kosmetik",
      "Visagist:IN",
      "Make-up Artist",
      "Permanent Make-up",
      "Wimpernverlängerung",
      "Brow Artist",
      "Nageldesign",
      "Fußpflege medizinisch",
      "Fußpflege kosmetisch",
      "Hautpflegeberatung",
    ],
    qualifications: [
      "Ausbildung Kosmetikerin",
      "Weiterbildung Visagistik",
      "Make-up Schulungen",
      "Permanent Make-up Zertifikat",
      "Microblading Zertifikat",
      "Wimpernverlängerung 1:1 Technik",
      "Wimpernvolumentechnik",
      "Brow Lifting",
      "Nageldesign Zertifikat",
      "Hygieneschulung",
      "Hautanalyse Skills",
      "Produktwissen Skincare Marken",
    ],
  },
];

// Helper: Get all category keys
export function listCategories(): { key: CategoryKey; title: string }[] {
  return TAXONOMY.map(c => ({ key: c.key, title: c.title }));
}
