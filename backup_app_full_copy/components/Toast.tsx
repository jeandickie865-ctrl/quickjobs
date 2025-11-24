import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ message, type, duration });
    
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToast(null);
      });
    }, duration);
  }, [fadeAnim]);

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim]);

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: colors.successLight, border: colors.success, text: colors.success };
      case 'error':
        return { bg: colors.errorLight, border: colors.error, text: colors.error };
      case 'warning':
        return { bg: colors.warningLight, border: colors.warning, text: colors.warning };
      case 'info':
      default:
        return { bg: colors.infoLight, border: colors.info, text: colors.info };
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            left: spacing.md,
            right: spacing.md,
            opacity: fadeAnim,
            zIndex: 9999,
          }}
        >
          <Pressable onPress={hideToast}>
            <View
              style={{
                backgroundColor: getToastColors(toast.type).bg,
                borderLeftWidth: 4,
                borderLeftColor: getToastColors(toast.type).border,
                borderRadius: 12,
                padding: spacing.md,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Text style={{ fontSize: 20 }}>{getToastIcon(toast.type)}</Text>
              <Text
                style={{
                  flex: 1,
                  color: getToastColors(toast.type).text,
                  fontSize: 15,
                  fontWeight: '600',
                  lineHeight: 22,
                }}
              >
                {toast.message}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
