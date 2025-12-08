import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface AppHeaderProps {
  title: string; // Screen name (z.B. "Meine Aufträge")
  rightElement?: ReactNode; // Optional element on the right (e.g. logout button)
}

export function AppHeader({ title, rightElement }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Links: QUICKJOBS */}
      <Text style={styles.brandName}>QUICKJOBS</Text>
      
      {/* Mitte: Screen-Titel */}
      <Text style={styles.screenTitle}>{title}</Text>
      
      {/* Rechts: Optional (z.B. Profil-Icon) */}
      <View style={styles.rightContainer}>
        {rightElement || <View style={{ width: 30 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent, // #EFABFF
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary, // #00A07C (grün)
    letterSpacing: 0.5,
  },
  screenTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text, // #1A1A1A (dunkelgrau)
    zIndex: -1, // Behind everything so left/right elements don't overlap
  },
  rightContainer: {
    minWidth: 30,
    alignItems: 'flex-end',
  },
});
