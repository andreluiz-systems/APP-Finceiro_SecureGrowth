import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { safeIcon } from '@/components/CategoryIcon';
import { CurrencyInput } from '@/components/CurrencyInput';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedModalContent } from '@/components/ThemedModalContent';
import { useDeleteGoal, useGoals, useSetGoalSaved } from '@/hooks/useGoals';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDate } from '@/lib/format';
import { applyDeposit, goalProgress, goalRemaining, isGoalReached, monthlyNeeded } from '@/lib/goals';
import { parseDueDate } from '@/lib/reminders';

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

export default function MetaDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: goals, isLoading } = useGoals();
  const setSaved = useSetGoalSaved();
  const remove = useDeleteGoal();

  const [error, setError] = useState<string>();
  const [sheet, setSheet] = useState<null | 'add' | 'remove'>(null);
  const [cents, setCents] = useState(0);
  const [sheetError, setSheetError] = useState<string>();

  const goal = goals?.find((g) => g.id === id);

  function openSheet(mode: 'add' | 'remove') {
    setCents(0);
    setSheetError(undefined);
    setSheet(mode);
  }

  async function confirmSheet() {
    if (!goal || !sheet) return;
    if (cents <= 0) {
      setSheetError('Informe um valor maior que zero.');
      return;
    }
    if (sheet === 'remove' && cents / 100 > goal.saved_amount) {
      setSheetError('Esse valor é maior do que o guardado.');
      return;
    }
    try {
      await setSaved.mutateAsync({
        id: goal.id,
        saved_amount: applyDeposit(goal.saved_amount, sheet === 'add' ? cents / 100 : -cents / 100),
      });
      setSheet(null);
    } catch (e) {
      setSheetError(dataErrorMessage(e));
    }
  }

  function confirmDelete() {
    if (!goal) return;
    Alert.alert('Excluir meta', `Excluir "${goal.name}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(goal.id);
            router.back();
          } catch (e) {
            setError(dataErrorMessage(e));
          }
        },
      },
    ]);
  }

  if (!goal) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Meta" />
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState
            icon="alert-circle"
            title="Meta não encontrada"
            actionLabel="Voltar"
            onAction={() => router.back()}
          />
        )}
      </Screen>
    );
  }

  const pct = goalProgress(goal);
  const reached = isGoalReached(goal);
  const perMonth = monthlyNeeded(goal);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Meta" />

      <View className="items-center rounded-3xl px-5 py-7" style={{ backgroundColor: isDark ? '#2A1650' : '#1A0B2E' }}>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <MaterialCommunityIcons name={safeIcon(goal.icon, 'flag-outline')} size={28} color="#FFFFFF" />
        </View>
        <AppText weight="semibold" tone="white" className="mt-5 text-center text-sm">
          {goal.name}
        </AppText>
        <AppText weight="bold" tone="white" className="mt-2 text-4xl">
          {formatCurrency(goal.saved_amount)}
        </AppText>
        <AppText tone="white" className="mt-1 text-xs opacity-80">
          de {formatCurrency(goal.target_amount)}
        </AppText>
        <View className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
          <View className="h-2.5 rounded-full bg-white" style={{ width: `${Math.round(pct * 100)}%` }} />
        </View>
        <AppText weight="semibold" tone="white" className="mt-2 text-xs">
          {reached ? 'Meta alcançada! 🎉' : `${Math.round(pct * 100)}% concluído`}
        </AppText>
      </View>

      <View className="mt-6 rounded-3xl bg-field px-5 py-1">
        <InfoRow label="falta guardar" value={formatCurrency(goalRemaining(goal))} />
        <InfoRow
          label="prazo"
          value={goal.deadline ? formatDate(parseDueDate(goal.deadline)) : 'Sem prazo'}
          last={perMonth === null}
        />
        {perMonth !== null ? <InfoRow label="guardar por mês" value={formatCurrency(perMonth)} last /> : null}
      </View>

      {error ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {error}
        </AppText>
      ) : null}

      <View className="mt-8 flex-row gap-3">
        <Button title="Adicionar valor" className="flex-1" onPress={() => openSheet('add')} />
        <Button
          title="Retirar"
          variant="soft"
          className="flex-1"
          disabled={goal.saved_amount <= 0}
          onPress={() => openSheet('remove')}
        />
      </View>
      <View className="mt-3 flex-row gap-3">
        <Button
          title="Editar"
          variant="soft"
          className="flex-1"
          onPress={() => router.push({ pathname: '/meta/form', params: { id: goal.id } })}
        />
        <Button
          title="Excluir"
          variant="danger"
          className="flex-1"
          loading={remove.isPending}
          onPress={confirmDelete}
        />
      </View>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <ThemedModalContent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
            <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setSheet(null)}>
              <Pressable className="rounded-t-3xl bg-card px-5 pb-8 pt-5" onPress={() => {}}>
                <AppText weight="bold" className="text-base">
                  {sheet === 'add' ? 'Adicionar valor' : 'Retirar valor'}
                </AppText>
                <AppText tone="muted" className="mt-1 text-xs">
                  {sheet === 'add'
                    ? `Quanto você guardou para "${goal.name}"?`
                    : `Guardado agora: ${formatCurrency(goal.saved_amount)}`}
                </AppText>
                <View className={`mt-4 rounded-2xl bg-field px-4 py-2 ${sheetError ? 'border border-danger' : ''}`}>
                  <CurrencyInput cents={cents} onChange={setCents} />
                </View>
                {sheetError ? (
                  <AppText tone="danger" className="ml-1 mt-1 text-xs">
                    {sheetError}
                  </AppText>
                ) : null}
                <Button title="Confirmar" className="mt-5" loading={setSaved.isPending} onPress={confirmSheet} />
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </ThemedModalContent>
      </Modal>
    </Screen>
  );
}
