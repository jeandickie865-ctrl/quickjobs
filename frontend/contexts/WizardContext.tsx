// contexts/WizardContext.tsx - Wizard State Management
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CategoryKey } from '../utils/categoryMapping';

interface WizardData {
  // Step 1
  photoUrl: string;
  firstName: string;
  lastName: string;
  shortBio: string;
  phone: string;
  
  // Step 2
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  lat?: number;
  lon?: number;
  radiusKm: number;
  
  // Step 3
  selectedCategories: CategoryKey[];
  
  // Step 4
  selectedSubcategories: string[];
  selectedQualifications: string[];
  
  // Legacy (kept for backward compatibility)
  selectedSkills: string[];
  isSelfEmployed?: boolean;
}

interface WizardContextType {
  wizardData: WizardData;
  updateWizardData: (data: Partial<WizardData>) => void;
  resetWizard: () => void;
}

const initialData: WizardData = {
  photoUrl: '',
  firstName: '',
  lastName: '',
  shortBio: '',
  phone: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'Deutschland',
  radiusKm: 20,
  selectedCategories: [],
  selectedSkills: [],
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wizardData, setWizardData] = useState<WizardData>(initialData);

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const resetWizard = () => {
    setWizardData(initialData);
  };

  return (
    <WizardContext.Provider value={{ wizardData, updateWizardData, resetWizard }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};
