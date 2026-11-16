import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { dataErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime } from '@/lib/format';

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

export default function TransacaoDetalhes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: transactions, isLoading } = useTransactions();
  const remove = useDeleteTransaction();
  const [error, setError] = useState<string>();

  const tx = transactions?.find((t) => t.id === id);

  function confirmDelete() {
    if (!tx) return;
    Alert.alert('Excluir transação', `Excluir "${tx.description}"? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(tx.id);
            router.back();
          } catch (e) {
            setError(dataErrorMessage(e));
          }
        },
      },
    ]);
  }

  if (!tx) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Detalhes" />
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" title="Transação não encontrada" actionLabel="Voltar" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  const amount = (tx.type === 'income' ? '+' : '-') + formatCurrency(Math.abs(tx.amount));

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Detalhes" />

      <View className="items-center rounded-3xl px-5 py-7" style={{ backgroundColor: isDark ? '#2A1650' : '#1A0B2E' }}>
        <CategoryIcon name={tx.category?.icon} size={56} variant="glass" />
        <AppText weight="semibold" tone="white" className="mt-5 text-center text-sm">
          {tx.description}
        </AppText>
        <AppText weight="bold" className="mt-2 text-4xl" style={{ color: tx.type === 'income' ? '#6EE7B7' : '#FFFFFF' }}>
          {amount}
        </AppText>
        <View className="mt-3 rounded-full bg-white/15 px-4 py-1">
          <AppText weight="medium" tone="white" className="text-xs">
            {tx.category?.name ?? 'Sem categoria'}
          </AppText>
        </View>
      </View>

      <View className="mt-6 rounded-3xl bg-field px-5 py-1">
        <InfoRow label="tipo" value={tx.type === 'income' ? 'Entrada' : 'Saída'} />
        <InfoRow label="data" value={formatDateTime(new Date(tx.occurred_at))} />
        <InfoRow label="categoria" value={tx.category?.name ?? 'Sem categoria'} />
        <InfoRow label="observação" value={tx.notes || '—'} last />
      </View>

      {error ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {error}
        </AppText>
      ) : null}

      <View className="mt-10 flex-row gap-3">
        <Button
          title="Editar"
          className="flex-1"
          onPress={() => router.push({ pathname: '/transacao/form', params: { id: tx.id } })}
        />
        <Button title="Excluir" variant="danger" className="flex-1" loading={remove.isPending} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
