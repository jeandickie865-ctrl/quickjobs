// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  useEffect(() => {
    if (isReady) {
      if (!user) {
        router.replace('/auth/start');
      } else if (!user.role) {
        router.replace('/auth/role-select');
      } else if (user.role === 'worker') {
        router.replace('/(worker)/feed');
      } else {
        router.replace('/(employer)');
      }
    }
  }, [isReady, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFABFF' }}>
      <ActivityIndicator size="large" color="#EFABFF" />
    </View>
  );
}
