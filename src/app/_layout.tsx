import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/components/ThemeProvider';
import { handleIncomingUrl } from '@/lib/recovery';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Protege as rotas: sem sessão não entra no app; com sessão não volta para o login. */
function useAuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const recovering = useAuthStore((s) => s.recovering);

  useEffect(() => {
    if (!initialized) return;
    const group = segments[0] as string | undefined;
    if (!session && group === '(app)') router.replace('/login');
    else if (session && !recovering && group === '(auth)') router.replace('/inicio');
  }, [initialized, session, recovering, segments, router]);
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const themeLoaded = useThemeStore((s) => s.loaded);

  useEffect(() => {
    useThemeStore.getState().load();
    return useAuthStore.getState().init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && themeLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, themeLoaded]);

  useAuthGuard();

  // Link de recuperação de senha aberto pelo e-mail. Captura por três caminhos
  // (link que abriu o app, link recebido com o app aberto e o último link) para não perder nenhum.
  const url = Linking.useLinkingURL();
  useEffect(() => {
    handleIncomingUrl(url);
  }, [url]);
  useEffect(() => {
    Linking.getInitialURL().then(handleIncomingUrl);
    const subscription = Linking.addEventListener('url', (event) => handleIncomingUrl(event.url));
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || !themeLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
