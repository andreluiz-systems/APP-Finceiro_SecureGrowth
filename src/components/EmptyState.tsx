import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View className="items-center px-6 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-soft">
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <AppText weight="bold" className="mt-4 text-center text-base">
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" className="mt-1 text-center text-sm">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} className="mt-5 self-stretch" onPress={onAction} /> : null}
    </View>
  );
}
