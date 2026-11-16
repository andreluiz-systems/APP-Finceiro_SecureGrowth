import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { themeVars } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Aplica as variáveis de cor do tema atual na raiz. Toda a UI usa essas variáveis. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { scheme } = useTheme();
  return (
    <View style={[{ flex: 1 }, themeVars[scheme]]} className="bg-bg">
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
