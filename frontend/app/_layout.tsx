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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/role" />
            <Stack.Screen name="test-taxonomy" />
            <Stack.Screen 
              name="test/taxonomy/index" 
              options={{ 
                headerShown: true, 
                title: 'Taxonomie Test' 
              }} 
            />
            <Stack.Screen 
              name="test/taxonomy/[cat]" 
              options={{ 
                headerShown: true, 
                title: 'Kategorie' 
              }} 
            />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}