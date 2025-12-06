import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TabButton } from '../../components/TabButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmployerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const map = {
          index: { label: 'Dashboard' },
          applications: { label: 'Aufträge' },
          matches: { label: 'Matches' },
          profile: { label: 'Profil' },
        };

        const tab = map[route.name];

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            height: 85,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 12,
            paddingBottom: 20,
            paddingHorizontal: 8,
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
