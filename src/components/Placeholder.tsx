import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';
import { Screen } from './Screen';
import { ScreenHeader } from './ScreenHeader';

type Props = {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  /** telas abertas a partir de outra (com botão de voltar) */
  back?: boolean;
};

/** Tela provisória das próximas etapas. */
export function Placeholder({ title, icon, back }: Props) {
  const { colors } = useTheme();
  return (
    <Screen scroll={false}>
      {back ? (
        <ScreenHeader title={title} />
      ) : (
        <AppText weight="bold" className="mt-6 text-2xl">
          {title}
        </AppText>
      )}
      <View className={`flex-1 items-center justify-center ${back ? '' : 'pb-24'}`}>
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-soft">
          <Feather name={icon} size={32} color={colors.primary} />
        </View>
        <AppText tone="muted" className="mt-4 text-center text-sm">
          Esta tela entra nas próximas etapas.
        </AppText>
      </View>
    </Screen>
  );
}
