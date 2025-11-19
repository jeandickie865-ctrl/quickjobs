import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Role = 'worker' | 'employer';

export default function RoleSelection() {
  const { colors, spacing } = useTheme();
  const { setUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);
    setLoading(true);

    try {
      await setUser({
        id: `temp-${Date.now()}`,
        email: 'temp@example.com',
        role,
      });
      
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('Error setting role:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.slogan, { color: colors.gray700, marginTop: spacing.sm }]}>
            wenn's jetzt passieren muss
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <Text style={[styles.title, { color: colors.black, marginBottom: spacing.xl }]}>
            Wie möchten Sie BCKP nutzen?
          </Text>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'worker' ? colors.black : colors.beige50,
                borderColor: selectedRole === 'worker' ? colors.black : colors.beige300,
                marginBottom: spacing.md,
              },
            ]}
            onPress={() => !loading && handleRoleSelect('worker')}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text
              style={[
                styles.roleTitle,
                { color: selectedRole === 'worker' ? colors.white : colors.black },
              ]}
            >
              Arbeitnehmer
            </Text>
            <Text
              style={[
                styles.roleDescription,
                { color: selectedRole === 'worker' ? colors.gray100 : colors.gray700 },
              ]}
            >
              Ich suche kurzfristige Jobs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: selectedRole === 'employer' ? colors.black : colors.beige50,
                borderColor: selectedRole === 'employer' ? colors.black : colors.beige300,
              },
            ]}
            onPress={() => !loading && handleRoleSelect('employer')}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text
              style={[
                styles.roleTitle,
                { color: selectedRole === 'employer' ? colors.white : colors.black },
              ]}
            >
              Arbeitgeber
            </Text>
            <Text
              style={[
                styles.roleDescription,
                { color: selectedRole === 'employer' ? colors.gray100 : colors.gray700 },
              ]}
            >
              Ich suche kurzfristig Arbeitskräfte
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.black} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  rolesContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 24,
    minHeight: 120,
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
});