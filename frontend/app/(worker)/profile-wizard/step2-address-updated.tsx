// UPDATED: Add useWizard imports and save data
import { useWizard } from '../../../contexts/WizardContext';

// In the component:
const { wizardData, updateWizardData } = useWizard();

// Initialize state from context:
const [street, setStreet] = useState(wizardData.street || '');
const [postalCode, setPostalCode] = useState(wizardData.postalCode || '');
const [city, setCity] = useState(wizardData.city || '');
const [lat, setLat] = useState<number | undefined>(wizardData.lat);
const [lon, setLon] = useState<number | undefined>(wizardData.lon);
const [radius, setRadius] = useState(wizardData.radiusKm || 25);

// In handleNext:
const handleNext = () => {
  if (validate()) {
    updateWizardData({ street, postalCode, city, lat, lon, radiusKm: radius });
    router.push('/(worker)/profile-wizard/step3-categories');
  }
};