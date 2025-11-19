// app/start.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Start() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Niemand eingeloggt → zum Auth-Start
  if (!user) {
    return <Redirect href="/auth/start" />;
  }

  // Eingeloggt, aber noch keine Rolle → Rollenwahl
  if (!user.role) {
    return <Redirect href="/onboarding/role" />;
  }

  // Rolle gesetzt → in den jeweiligen Bereich
  if (user.role === 'worker') {
    return <Redirect href="/(worker)/feed" />;
  }

  if (user.role === 'employer') {
    return <Redirect href="/(employer)" />;
  }

  return <Redirect href="/taxonomy" />;
}