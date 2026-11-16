import { useColorScheme } from 'react-native';

import { hexColors, type ThemeScheme } from '@/constants/theme';
import { useThemeStore } from '@/store/theme';

/** Tema atual (claro/escuro), considerando a preferência do usuário ou do sistema. */
export function useTheme() {
  const system = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const scheme: ThemeScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return {
    scheme,
    isDark: scheme === 'dark',
    preference,
    setPreference,
    colors: hexColors[scheme],
  };
}
