import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function Index() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/onboarding/role" />;
  }

  return <Redirect href="/test-taxonomy" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});