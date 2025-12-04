import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { euro, feeCents, employerTotalCents } from '../utils/pricing';

export function CostBreakdown({ workerAmountCents }: { workerAmountCents: number }) {
  const { colors } = useTheme();
  const fee = feeCents(workerAmountCents);
  const total = employerTotalCents(workerAmountCents);

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text }}>An Arbeitnehmer</Text>
        <Text style={{ color: colors.text }}>{euro(workerAmountCents)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text }}>Plattform 20 %</Text>
        <Text style={{ color: colors.text }}>{euro(fee)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>Gesamt für dich</Text>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{euro(total)}</Text>
      </View>
    </View>
  );
}