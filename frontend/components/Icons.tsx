import React from 'react';
import { Text } from 'react-native';

// Simple icon components using emoji as fallback
export const Eye = ({ size = 20, color = '#000' }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size }}>👁️</Text>
);

export const EyeOff = ({ size = 20, color = '#000' }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size }}>🙈</Text>
);

export const Briefcase = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size }}>💼</Text>
);

export const UserCheck = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size }}>✅</Text>
);

export const Home = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size }}>🏠</Text>
);
