import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

type Props = { title: string; right?: ReactNode };

/** Cabeçalho das telas internas: botão de voltar redondo, título centralizado e um espaço à direita. */
export function ScreenHeader({ title, right }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  }

  return (
    <View className="mb-4 mt-2 h-11 flex-row items-center justify-between">
      <Pressable
        onPress={goBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        className="h-11 w-11 items-center justify-center rounded-full bg-soft active:opacity-70">
        <Feather name="chevron-left" size={22} color={colors.muted} />
      </Pressable>
      <AppText weight="bold" className="text-base">
        {title}
      </AppText>
      <View className="h-11 w-11 items-center justify-center">{right}</View>
    </View>
  );
}
