// app/(worker)/profile-wizard/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileWizardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
