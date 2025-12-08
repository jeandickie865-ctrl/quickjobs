import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/colors';

interface AppHeaderProps {
  title?: string; // Screen name (optional)
  rightElement?: ReactNode; // Optional element on the right (e.g. logout button)
}

export function AppHeader({ title, rightElement }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Links: LOGO */}
      <Image
        source={{ uri: 'https://customer-assets.emergentagent.com/job_129a3665-288c-42bb-9ab2-25aee1dfc3eb/artifacts/4jtdk7oz_Black%20White%20Minimal%20Simple%20Modern%20Letter%20A%20%20Arts%20Gallery%20%20Logo-12.png' }}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Mitte: Screen-Titel (optional) */}
      {title && <Text style={styles.screenTitle}>{title}</Text>}
      
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
    color: '#FF773D', // Orange
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
