// types/profile.ts

import { Address } from './address';

export type DocumentType = 
  | 'fuehrungszeugnis'
  | 'ausweis'
  | 'qualifikation'
  | 'arbeitserlaubnis'
  | 'sonstiges';

export type WorkerDocument = {
  id: string;
  type: DocumentType;
  fileUri: string;
  fileName: string;
  uploadedAt: string;
  mimeType?: string;
};

export type WorkerProfile = {
  userId: string;
  categories: string[];          // category keys aus taxonomy.json
  subcategories?: string[];      // NEW: subcategory keys aus taxonomy.json
  qualifications?: string[];     // NEW: qualification keys aus taxonomy.json
  selectedTags: string[];        // DEPRECATED: legacy tag keys
  radiusKm: number;
  homeAddress: Address;          // Strukturierte Adresse (statt string)
  homeLat?: number | null;       // Koordinaten - NIEMALS 0 als Fallback!
  homeLon?: number | null;       // Koordinaten - NIEMALS 0 als Fallback!
  profilePhotoUri?: string;      // Lokale URI zum Profilfoto
  photoUrl?: string;             // Backend URL zum Profilfoto
  documents?: WorkerDocument[];  // Liste der Dokumente
  
  // Steckbrief und Kontaktdaten (neu)
  firstName?: string;            // Vorname für persönliche Ansprache
  lastName?: string;             // Nachname
  shortBio?: string;             // Kurzer Steckbrief, vor Match sichtbar
  phone?: string;                // Telefonnummer
  email?: string;                // E-Mail
  contactPhone?: string;         // DEPRECATED: use phone
  contactEmail?: string;         // DEPRECATED: use email
  isSelfEmployed?: boolean;      // Selbstständig Checkbox
  
  // Push Notifications
  pushToken?: string;            // Expo Push Token für Benachrichtigungen
};

export type EmployerProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  lat?: number;
  lon?: number;
  paymentMethod: 'card' | 'paypal' | null;
  shortBio?: string;
  profilePhotoUri?: string;
};

export type Job = {
  _id: string;
  employerId: string;
  title: string;
  category: string;
  required_all_tags: string[];
  required_any_tags: string[];
  startAt: string;
  endAt: string;
  compensation: number;
  paymentMethod: 'cash' | 'paypal' | 'transfer';
  locationLat: number;
  locationLon: number;
  locationAddress: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
};