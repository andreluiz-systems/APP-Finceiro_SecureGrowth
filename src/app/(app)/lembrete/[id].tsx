import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { STATE_STYLE } from '@/components/ReminderRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDeleteReminder, useReminders, useSetReminderPaid } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { NOTIFY_DAYS_BEFORE, dueLabel, parseDueDate, reminderState } from '@/lib/reminders';

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-start justify-between py-3 ${last ? '' : 'border-b border-line'}`}>
      <AppText weight="medium" tone="muted" className="text-xs">
        {label}
      </AppText>
      <AppText weight="semibold" className="ml-6 flex-1 text-right text-xs">
        {value}
      </AppText>
    </View>
  );
}

export default function LembreteDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: reminders, isLoading } = useReminders();
  const setPaid = useSetReminderPaid();
  const remove = useDeleteReminder();
  const [error, setError] = useState<string>();

  const reminder = reminders?.find((r) => r.id === id);

  async function togglePaid() {
    if (!reminder) return;
    setError(undefined);
    try {
      await setPaid.mutateAsync({ id: reminder.id, paid: reminder.status !== 'paid' });
    } catch (e) {
      setError(dataErrorMessage(e));
    }
  }

  function confirmDelete() {
    if (!reminder) return;
    Alert.alert('Excluir lembrete', `Excluir "${reminder.name}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(reminder.id);
            router.back();
          } catch (e) {
            setError(dataErrorMessage(e));
          }
        },
      },
    ]);
  }

  if (!reminder) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Detalhes" />
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" title="Lembrete não encontrado" actionLabel="Voltar" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  const state = reminderState(reminder);
  const style = STATE_STYLE[state];
  const paid = reminder.status === 'paid';

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Detalhes" />

      <View className="items-center rounded-3xl px-5 py-7" style={{ backgroundColor: isDark ? '#2A1650' : '#1A0B2E' }}>
        <CategoryIcon name={reminder.category?.icon} size={56} variant="glass" />
        <AppText weight="semibold" tone="white" className="mt-5 text-center text-sm">
          {reminder.name}
        </AppText>
        <AppText weight="bold" tone="white" className="mt-2 text-4xl">
          {formatCurrency(reminder.amount)}
        </AppText>
        <View className={`mt-3 rounded-full px-4 py-1 ${style.box}`}>
          <AppText weight="semibold" tone={style.text} className="text-xs">
            {paid ? 'Pago' : dueLabel(reminder.due_date)}
          </AppText>
        </View>
      </View>

      <View className="mt-6 rounded-3xl bg-field px-5 py-1">
        <InfoRow label="vencimento" value={formatDate(parseDueDate(reminder.due_date))} />
        <InfoRow label="categoria" value={reminder.category?.name ?? 'Sem categoria'} />
        <InfoRow label="repete" value={reminder.repeat_monthly ? 'Todo mês' : 'Não repete'} />
        <InfoRow
          label="aviso"
          value={reminder.notify_before ? `${NOTIFY_DAYS_BEFORE} dias antes e no dia` : 'Desligado'}
          last={!paid}
        />
        {paid && reminder.paid_at ? <InfoRow label="pago em" value={formatDateTime(new Date(reminder.paid_at))} last /> : null}
      </View>

      <AppText tone="muted" className="mt-3 text-center text-xs">
        Marcar como pago é só uma anotação sua: o app não faz pagamentos.
      </AppText>

      {error ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {error}
        </AppText>
      ) : null}

      <Button
        title={paid ? 'Desfazer pagamento' : 'Marcar como pago'}
        variant={paid ? 'outline' : 'primary'}
        className="mt-6"
        loading={setPaid.isPending}
        onPress={togglePaid}
      />
      <View className="mt-3 flex-row gap-3">
        <Button
          title="Editar"
          variant="soft"
          className="flex-1"
          onPress={() => router.push({ pathname: '/lembrete/form', params: { id: reminder.id } })}
        />
        <Button title="Excluir" variant="danger" className="flex-1" loading={remove.isPending} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
