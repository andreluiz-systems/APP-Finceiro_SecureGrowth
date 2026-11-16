import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { gradients } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

const MIN_SPLASH_MS = 1600;

/** Splash animada: aparece enquanto o app lê a sessão e decide para onde ir. */
export default function Splash() {
  const router = useRouter();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const recovering = useAuthStore((s) => s.recovering);
  const startedAt = useRef(Date.now());
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (!initialized) return;
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt.current));
    const timer = setTimeout(() => router.replace(recovering ? '/nova-senha' : session ? '/inicio' : '/login'), wait);
    return () => clearTimeout(timer);
  }, [initialized, session, recovering, router]);

  return (
    <LinearGradient colors={gradients.splash} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <AppLogo size={112} />
      </Animated.View>
    </LinearGradient>
  );
}
