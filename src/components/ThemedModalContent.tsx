import type { ReactNode } from 'react';
import { View } from 'react-native';

import { themeVars } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Reaplica as cores do tema dentro de um <Modal>. No celular o tema já atravessa o Modal,
 * mas no navegador o Modal sai da árvore da tela e perderia as variáveis de cor.
 */
export function ThemedModalContent({ children }: { children: ReactNode }) {
  const { scheme } = useTheme();
  return <View style={[{ flex: 1 }, themeVars[scheme]]}>{children}</View>;
}
