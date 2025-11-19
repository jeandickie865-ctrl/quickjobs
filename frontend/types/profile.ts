// types/profile.ts

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
  categories: string[];      // category keys aus taxonomy.json
  selectedTags: string[];    // tag keys aus taxonomy.json
  radiusKm: number;
  homeAddress: string;
  homeLat: number;
  homeLon: number;
  profilePhotoUri?: string;  // Lokale URI zum Profilfoto
  documents?: WorkerDocument[]; // Liste der Dokumente
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