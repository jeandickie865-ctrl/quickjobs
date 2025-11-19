import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function Index() {
  const { user } = useAuth();
  const { colors } = useTheme();

  if (!user) {
    return <Redirect href="/onboarding/role" />;
  }

  return <Redirect href="/(tabs)/taxonomy" />;
}