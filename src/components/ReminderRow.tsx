import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { formatCurrency, formatDate } from '@/lib/format';
import { dueLabel, parseDueDate, reminderState, type ReminderState } from '@/lib/reminders';
import type { ReminderWithCategory } from '@/types/database';

import { AppText } from './AppText';
import { CategoryIcon } from './CategoryIcon';

/** Cores do selo de cada situação (usa os tokens do tema, então funciona no claro e no escuro). */
export const STATE_STYLE: Record<ReminderState, { box: string; text: 'danger' | 'success' | 'muted' | 'primary'; icon: keyof typeof Feather.glyphMap }> = {
  overdue: { box: 'bg-danger-soft', text: 'danger', icon: 'alert-circle' },
  today: { box: 'bg-warning-soft', text: 'danger', icon: 'clock' },
  soon: { box: 'bg-warning-soft', text: 'muted', icon: 'clock' },
  upcoming: { box: 'bg-soft', text: 'primary', icon: 'calendar' },
  paid: { box: 'bg-success-soft', text: 'success', icon: 'check-circle' },
};

type Props = { reminder: ReminderWithCategory; onPress: () => void };

export function ReminderRow({ reminder, onPress }: Props) {
  const { colors } = useTheme();
  const state = reminderState(reminder);
  const style = STATE_STYLE[state];
  const label = state === 'paid' ? 'Pago' : dueLabel(reminder.due_date);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${reminder.name}, ${formatCurrency(reminder.amount)}, ${label}`}
      className="flex-row items-center border-b border-line py-3 active:opacity-70">
      <CategoryIcon name={reminder.category?.icon} size={44} />
      <View className="ml-3 flex-1">
        <AppText weight="semibold" className="text-sm" numberOfLines={1}>
          {reminder.name}
        </AppText>
        <View className="mt-1 flex-row items-center">
          <View className={`flex-row items-center rounded-full px-2 py-0.5 ${style.box}`}>
            <AppText weight="semibold" tone={style.text} className="text-[11px]">
              {label}
            </AppText>
          </View>
          <AppText tone="muted" className="ml-2 text-[11px]">
            {formatDate(parseDueDate(reminder.due_date))}
          </AppText>
          {reminder.repeat_monthly ? (
            <Feather name="repeat" size={11} color={colors.muted} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      </View>
      <AppText weight="bold" className="ml-2 text-sm">
        {formatCurrency(reminder.amount)}
      </AppText>
      <Feather name="chevron-right" size={18} color={colors.muted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}
