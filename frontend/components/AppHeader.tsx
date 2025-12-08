import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent, // #EFABFF
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: COLORS.text, // #1A1A1A
    textAlign: 'left',
  },
});
