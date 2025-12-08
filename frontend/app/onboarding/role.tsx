// app/onboarding/role.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#00A07C",
  black: '#000000',
  whiteTransparent: 'rgba(255,255,255,0.85)',
  neonShadow: 'rgba(200,255,22,0.1)',
};

type Role = 'employer' | 'worker';

export default function RoleSelectionScreen() {
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade-in Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      // Rolle wird vom Backend via /auth/me verwaltet
      // Hier nur Navigation zur Startseite
      router.replace('/start');
    } catch (error) {
      console.error('Fehler beim Navigieren:', error);
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ 
    role, 
    title, 
    description, 
    icon,
    scaleAnim,
  }: { 
    role: Role; 
    title: string; 
    description: string; 
    icon: 'person-outline' | 'briefcase-outline';
    scaleAnim: Animated.Value;
  }) => {
    const isSelected = selectedRole === role;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => setSelectedRole(role)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 32,
            borderWidth: 3,
            borderColor: isSelected ? COLORS.neon : 'transparent',
            shadowColor: isSelected ? COLORS.neon : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isSelected ? 0.3 : 0.08,
            shadowRadius: isSelected ? 12 : 6,
            elevation: isSelected ? 6 : 3,
            alignItems: 'center',
          }}
        >
          {/* Icon */}
          <View style={{
            marginBottom: 16,
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isSelected ? COLORS.neon : '#F5F5F5',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons 
              name={icon} 
              size={32} 
              color={isSelected ? COLORS.black : COLORS.purple} 
            />
          </View>

          {/* Title */}
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '700', 
            color: COLORS.black,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {title}
          </Text>

          {/* Description */}
          <Text style={{ 
            fontSize: 14, 
            color: '#666666',
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {description}
          </Text>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={{
              marginTop: 16,
              paddingVertical: 6,
              paddingHorizontal: 16,
              backgroundColor: COLORS.neon,
              borderRadius: 12,
            }}>
              <Text style={{ 
                fontSize: 13, 
                fontWeight: '700', 
                color: COLORS.black,
              }}>
                ✓ Ausgewählt
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Optional Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        marginLeft: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.15,
        blur: 80,
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={{ 
          flex: 1, 
          paddingHorizontal: 24,
          paddingVertical: 32,
          opacity: fadeAnim,
        }}>
          {/* Logo */}
          <View style={{ 
            alignItems: 'center', 
            marginBottom: 32,
          }}>
            <View style={{
              width: 80,
              height: 80,
              backgroundColor: COLORS.neon,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: COLORS.purple,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_worklink-staging/artifacts/ojjtt4kg_Design%20ohne%20Titel.png' }}
                style={{ width: 56, height: 56 }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Headline */}
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '900', 
            color: COLORS.white,
            textAlign: 'center',
            marginBottom: 32,
            letterSpacing: 0.2,
          }}>
            Wie möchtest du{'\n'}BACKUP nutzen?
          </Text>

          {/* Role Cards */}
          <View style={{ gap: 20, marginBottom: 32 }}>
            <RoleCard
              role="worker"
              title="Ich suche Jobs"
              description="Finde Aufträge in deiner Nähe und verdiene Geld flexibel."
              icon="person-outline"
              scaleAnim={card1Scale}
            />

            <RoleCard
              role="employer"
              title="Ich suche Unterstützung"
              description="Erstelle Aufträge und finde schnell die richtige Hilfe."
              icon="briefcase-outline"
              scaleAnim={card2Scale}
            />
          </View>

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: 20 }} />

          {/* Primary Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!selectedRole || loading}
            style={({ pressed }) => ({
              backgroundColor: !selectedRole || loading ? '#B3B3B3' : COLORS.neon,
              height: 56,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            })}
          >
            <Text style={{ 
              fontSize: 17, 
              fontWeight: '700', 
              color: COLORS.black,
              letterSpacing: 0.3,
            }}>
              {loading ? 'Lädt...' : 'Weiter'}
            </Text>
          </Pressable>

          {/* Helper Text */}
          <Text style={{ 
            fontSize: 13, 
            color: COLORS.whiteTransparent,
            textAlign: 'center',
            fontWeight: '500',
          }}>
            Du kannst deine Rolle später jederzeit ändern.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
