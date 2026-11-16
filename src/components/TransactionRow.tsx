import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { formatSigned, formatTime, relativeDateTime } from '@/lib/format';
import type { TransactionWithCategory } from '@/types/database';

import { AppText } from './AppText';
import { CategoryIcon } from './CategoryIcon';

type Props = {
  tx: TransactionWithCategory;
  onPress: () => void;
  /** "panel" é o estilo claro sobre o cartão roxo escuro do dashboard */
  variant?: 'list' | 'panel';
};

export function TransactionRow({ tx, onPress, variant = 'list' }: Props) {
  const { colors } = useTheme();
  const date = new Date(tx.occurred_at);
  const panel = variant === 'panel';
  const amount = formatSigned(tx.type, tx.amount);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tx.description}, ${amount}`}
      className={`flex-row items-center py-3 active:opacity-70 ${panel ? '' : 'border-b border-line'}`}>
      <CategoryIcon name={tx.category?.icon} size={panel ? 48 : 44} variant={panel ? 'glass' : 'soft'} />
      <View className="ml-3 flex-1">
        <AppText weight="semibold" tone={panel ? 'white' : 'ink'} numberOfLines={1} className="text-sm">
          {tx.description}
        </AppText>
        <AppText tone={panel ? 'white' : 'muted'} className={`mt-0.5 text-xs ${panel ? 'opacity-70' : ''}`} numberOfLines={1}>
          {panel ? relativeDateTime(date) : `${tx.category?.name ?? 'Sem categoria'}, ${formatTime(date)}`}
        </AppText>
      </View>
      {panel ? (
        <AppText weight="bold" className="text-sm" style={{ color: tx.type === 'income' ? '#6EE7B7' : '#FCA5A5' }}>
          {amount}
        </AppText>
      ) : (
        <>
          <AppText weight="semibold" tone={tx.type === 'income' ? 'income' : 'expense'} className="text-xs">
            {amount}
          </AppText>
          <Feather name="chevron-right" size={18} color={colors.muted} style={{ marginLeft: 8 }} />
        </>
      )}
    </Pressable>
  );
}
