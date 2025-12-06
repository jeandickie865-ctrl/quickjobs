import { Tabs } from 'expo-router';
import { TabButton } from '../../components/TabButton';
import { COLORS } from '../../constants/colors';

export default function WorkerLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const map = {
          feed: { label: 'Aktuell' },
          jobs: { label: 'Alle Jobs' },
          applications: { label: 'Bewerbungen' },
          matches: { label: 'Matches' },
          profile: { label: 'Profil' },
        };

        const tab = map[route.name];

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            height: 70,
            paddingTop: 10,
            paddingBottom: 20,
            paddingHorizontal: 10,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          },
          tabBarItemStyle: {
            width: 'auto',
          },
          tabBarButton: ({ onPress, accessibilityState }) => {
            return (
              <TabButton
                onPress={onPress}
                focused={accessibilityState.selected}
                label={tab?.label}
              />
            );
          },
        };
      }}
    />
  );
}
