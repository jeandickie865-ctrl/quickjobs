// Tag Label Mapping für UI-Anzeige
// Maps tag-keys to human-readable German labels

export const TAG_LABELS: Record<string, string> = {
  // Sicherheit
  "unterrichtung-34a": "§34a Unterrichtung",
  "bewacher-id": "Bewacher-ID",
  "erste-hilfe": "Erste Hilfe",
  "deeskalation": "Deeskalation",
  "lageeinschaetzung": "Lageeinschätzung",
  "event-erfahrung": "Event-Erfahrung",
  "objektschutz": "Objektschutz",
  "handfunkgeraet": "Handfunkgerät",
  "nachtarbeit": "Nachtarbeit",

  // Gastronomie
  "service-erfahrung": "Service-Erfahrung",
  "zapfen": "Zapfen",
  "kassieren": "Kassieren",
  "tablett": "Tablett-Service",
  "fruehstueck": "Frühstücksservice",
  "buffet": "Buffet-Service",
  "cocktail-kenntnisse": "Cocktail-Kenntnisse",

  // Lieferservice
  "fahrrad": "Fahrrad",
  "roller": "Roller",
  "auto": "Auto",
  "navigation": "Navigation",
  "kundenkontakt": "Kundenkontakt",

  // Lager & Logistik
  "hubwagen": "Hubwagen",
  "scanner": "Scanner",
  "kommissionieren": "Kommissionieren",
  "verpacken": "Verpacken",
  "regalpflege": "Regalpflege",
  "pickpack": "Pick & Pack",
  "staplerschein": "Staplerschein",

  // Einzelhandel
  "warenverraeumung": "Warenverräumung",
  "kundenberatung": "Kundenberatung",
  "umgang-mit-scanner": "Scanner-Bedienung",
  "etikettieren": "Etikettieren",
  "lagererfahrung": "Lagererfahrung",

  // Event & Messe
  "aufbau": "Aufbau",
  "abbau": "Abbau",
  "kundenbetreuung": "Kundenbetreuung",
  "kassenkenntnisse": "Kassenkenntnisse",
  "promo-erfahrung": "Promo-Erfahrung",
  "ticketing": "Ticketing",

  // Reinigung
  "grundreinigung": "Grundreinigung",
  "hotelreinigung": "Hotelreinigung",
  "fensterreinigung": "Fensterreinigung",
  "schluesseluebergabe": "Schlüsselübergabe",
  "buero-reinigung": "Büroreinigung",

  // Bau & Helfer
  "schutzkleidung": "Schutzkleidung",
  "werkzeug-kenntnisse": "Werkzeug-Kenntnisse",
  "schubkarre": "Schubkarre",
  "abbruch": "Abbrucharbeiten",
  "materialtransport": "Materialtransport",
  "leiterkenntnisse": "Leiterkenntnisse",

  // Haus & Garten
  "rasenmaehen": "Rasenmähen",
  "heckenschneiden": "Heckenschneiden",
  "gartenpflege": "Gartenpflege",
  "bewaesserung": "Bewässerung",
  "kleinreparaturen": "Kleinreparaturen",

  // Babysitting & Kinder
  "erste-hilfe-kind": "Erste Hilfe (Kind)",
  "erfahrung-babysitting": "Babysitting-Erfahrung",
  "hausaufgaben": "Hausaufgabenbetreuung",
  "haushalt-light": "Haushalt (leicht)",

  // Kleinstreparaturen & Handwerk
  "bohren": "Bohren",
  "schrauben": "Schrauben",
  "montage": "Montage",
  "moebelaufbau": "Möbelaufbau",

  // Haustiere
  "hundeerfahrung": "Hundeerfahrung",
  "katzenpflege": "Katzenpflege",
  "gassiservice": "Gassi-Service",
  "tierbetreuung": "Tierbetreuung",
  "tiermedizin-basic": "Tiermedizin (Basics)",

  // Umzug & Transport
  "tragen": "Tragen",
  "fahrzeug": "Fahrzeug vorhanden",
  "verpacken": "Verpacken",
  "demontage": "Demontage",
  "montage": "Montage",
  "schwerlast": "Schwerlast",

  // Büro & Service
  "datenpflege": "Datenpflege",
  "kassensysteme": "Kassensysteme",
  "crm": "CRM-Kenntnisse",
  "telefonie": "Telefonie",
  "postbearbeitung": "Postbearbeitung",

  // IT Support
  "hardware-basic": "Hardware (Basics)",
  "netzwerk-basic": "Netzwerk (Basics)",
  "drucker": "Drucker",
  "windows": "Windows",
  "macos": "macOS",
  "software-installation": "Software-Installation",
  "support-erfahrung": "Support-Erfahrung",

  // Foto & Video
  "kamera-bedienung": "Kamera-Bedienung",
  "licht": "Licht",
  "schnitt": "Schnitt",
  "ton": "Ton",
  "bilder-bearbeiten": "Bildbearbeitung",
  "social-media": "Social Media",

  // Nachhilfe
  "mathe": "Mathe",
  "englisch": "Englisch",
  "deutsch": "Deutsch",
  "naturwissenschaften": "Naturwissenschaften",
  "hausaufgabenbetreuung": "Hausaufgabenbetreuung",
  "unterrichtserfahrung": "Unterrichtserfahrung",

  // Fahrdienst
  "fuehrerschein-b": "Führerschein Klasse B",
  "personenbefoerderung": "Personenbeförderung",
  "fahrzeugpflege": "Fahrzeugpflege",

  // Hauswirtschaft
  "kochen": "Kochen",
  "waschen": "Waschen",
  "buegeln": "Bügeln",
  "betreuung-basic": "Betreuung (Basics)",
  "einkaufen": "Einkaufen",
};

// Category Labels
export const CATEGORY_LABELS: Record<string, string> = {
  "sicherheit": "Sicherheit",
  "gastronomie": "Gastronomie",
  "lieferservice": "Lieferservice",
  "lager_logistik": "Lager & Logistik",
  "einzelhandel": "Einzelhandel",
  "event_messe": "Event & Messe",
  "reinigung": "Reinigung",
  "bau_helfer": "Bau & Helfer",
  "haus_garten": "Haus & Garten",
  "babysitting_kinder": "Babysitting & Kinder",
  "kleinstreparaturen_handwerk": "Kleinstreparaturen & Handwerk",
  "haustiere": "Haustiere",
  "umzug_transport": "Umzug & Transport",
  "buero_service": "Büro & Service",
  "it_support": "IT Support",
  "foto_video": "Foto & Video",
  "nachhilfe": "Nachhilfe",
  "fahrdienst": "Fahrdienst",
  "hauswirtschaft": "Hauswirtschaft",
};

// Helper function to get label
export function getTagLabel(tagKey: string): string {
  return TAG_LABELS[tagKey] || tagKey;
}

export function getCategoryLabel(categoryKey: string): string {
  return CATEGORY_LABELS[categoryKey] || categoryKey;
}
