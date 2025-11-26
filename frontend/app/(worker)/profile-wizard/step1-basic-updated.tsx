// UPDATED: Add useWizard imports and save data
import { useWizard } from '../../../contexts/WizardContext';

// In the component:
const { wizardData, updateWizardData } = useWizard();

// Initialize state from context:
const [photoUrl, setPhotoUrl] = useState(wizardData.photoUrl || '');
const [firstName, setFirstName] = useState(wizardData.firstName || '');
const [lastName, setLastName] = useState(wizardData.lastName || '');
const [shortBio, setShortBio] = useState(wizardData.shortBio || '');
const [phone, setPhone] = useState(wizardData.phone || '');

// In handleNext:
const handleNext = () => {
  if (validate()) {
    updateWizardData({ photoUrl, firstName, lastName, shortBio, phone });
    router.push('/(worker)/profile-wizard/step2-address');
  }
};