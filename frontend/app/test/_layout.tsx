import React from 'react';
import { Stack } from 'expo-router';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen name="taxonomy/index" options={{ title: 'Taxonomie Test' }} />
      <Stack.Screen name="taxonomy/[cat]" options={{ title: 'Kategorie' }} />
    </Stack>
  );
}