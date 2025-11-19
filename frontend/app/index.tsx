import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/onboarding/role" />;
  }

  // Route based on user role
  if (user.role === 'worker') {
    return <Redirect href="/(worker)/profile" />;
  }

  return <Redirect href="/taxonomy" />;
}