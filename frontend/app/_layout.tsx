import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}