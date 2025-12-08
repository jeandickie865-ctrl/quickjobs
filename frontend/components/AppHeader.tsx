import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface AppHeaderProps {
  title: string;
  rightElement?: ReactNode; // Optional element on the right (e.g. logout button)
}

export function AppHeader({ title, rightElement }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {rightElement ? (
        // Header with right element (e.g. profile page with logout)
        <>
          <View style={{ width: 30 }} />
          <Text style={styles.titleCentered}>{title}</Text>
          <View>{rightElement}</View>
        </>
      ) : (
        // Simple header with just title
        <Text style={styles.title}>{title}</Text>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary, // #00A07C (grün)
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  titleCentered: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary, // #00A07C (grün)
    textAlign: 'center',
    flex: 1,
    textTransform: 'uppercase',
  },
});
