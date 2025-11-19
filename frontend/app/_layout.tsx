import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/role" options={{ headerShown: false }} />
            <Stack.Screen name="test-taxonomy" options={{ headerShown: false }} />
            <Stack.Screen 
              name="test/taxonomy/index" 
              options={{ 
                headerShown: true, 
                title: 'Taxonomie Test',
                headerBackTitle: 'Zurück'
              }} 
            />
            <Stack.Screen 
              name="test/taxonomy/[cat]" 
              options={{ 
                headerShown: true, 
                title: 'Kategorie',
                headerBackTitle: 'Zurück'
              }} 
            />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}