import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TabButton } from '../../components/TabButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const map = {
          feed: { label: 'Aktuell' },
          all: { label: 'Alle Jobs' },
          applications: { label: 'Bewerbungen' },
          matches: { label: 'Matches' },
          profile: { label: 'Profil' },
        };

        const tab = map[route.name];

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            height: 60,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 8,
            paddingBottom: 12,
            elevation: 0,
          },
          tabBarButton: (props) => {
            const { onPress, accessibilityState } = props;
            const focused = accessibilityState.selected;

            return (
              <TabButton
                onPress={onPress}
                focused={focused}
                label={tab?.label}
              />
            );
          },
        };
      }}
    />
  );
}
