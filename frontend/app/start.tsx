import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function Start() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/start" />;
  }

  if (!user.role) {
    return <Redirect href="/onboarding/role" />;
  }

  if (user.role === 'worker') {
    return <Redirect href="/(worker)/profile" />;
  }

  if (user.role === 'employer') {
    return <Redirect href="/taxonomy" />;
  }

  return <Redirect href="/auth/start" />;
}