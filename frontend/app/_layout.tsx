import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Head from 'expo-router/head';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Head>
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />
        <meta httpEquiv="Content-Language" content="de" />
        <html translate="no" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}