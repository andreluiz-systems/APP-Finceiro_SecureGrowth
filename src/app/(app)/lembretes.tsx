import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ReminderRow } from '@/components/ReminderRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useReminders } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { filterReminders, overdueReminders, sumAmount, type ReminderTab } from '@/lib/reminders';

const TABS: { value: ReminderTab; label: string }[] = [
  { value: 'todos', label: 'todos' },
  { value: 'semana', label: 'esta semana' },
  { value: 'pagos', label: 'pagos' },
];

const EMPTY: Record<ReminderTab, { title: string; message: string }> = {
  todos: { title: 'Nenhum lembrete', message: 'Cadastre suas contas para não esquecer nenhum vencimento.' },
  semana: { title: 'Nada vence esta semana', message: 'Você está em dia pelos próximos 7 dias.' },
  pagos: { title: 'Nenhuma conta paga', message: 'As contas que você marcar como pagas aparecem aqui.' },
};

/** Alertas e lembretes de contas a pagar. */
export default function Lembretes() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useReminders();
  const [tab, setTab] = useState<ReminderTab>('todos');

  const all = data ?? [];
  const list = useMemo(() => filterReminders(all, tab), [all, tab]);
  const overdue = useMemo(() => overdueReminders(all), [all]);
  const pendingTotal = useMemo(() => sumAmount(list), [list]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <View className="px-5">
        <ScreenHeader
          title="Alertas e lembretes"
          right={
            <Pressable
              onPress={() => router.push('/lembrete/form')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Novo lembrete"
              className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80">
              <Feather name="plus" size={22} color="#FFFFFF" />
            </Pressable>
          }
        />

        {overdue.length > 0 ? (
          <Pressable
            onPress={() => setTab('todos')}
            accessibilityRole="button"
            className="mb-4 flex-row items-center rounded-2xl bg-danger-soft px-4 py-3">
            <Feather name="alert-triangle" size={20} color={colors.danger} />
            <View className="ml-3 flex-1">
              <AppText weight="bold" tone="danger" className="text-sm">
                {overdue.length === 1 ? '1 conta atrasada' : `${overdue.length} contas atrasadas`}
              </AppText>
              <AppText tone="danger" className="text-xs">
                Total de {formatCurrency(sumAmount(overdue))}
              </AppText>
            </View>
          </Pressable>
        ) : null}

        <View className="flex-row items-center gap-2">
          {TABS.map((t) => (
            <Chip key={t.value} label={t.label} selected={tab === t.value} onPress={() => setTab(t.value)} />
          ))}
        </View>

        {list.length > 0 && tab !== 'pagos' ? (
          <AppText tone="muted" className="mb-1 mt-4 text-xs">
            {list.length === 1 ? '1 conta' : `${list.length} contas`} · {formatCurrency(pendingTotal)} a pagar
          </AppText>
        ) : (
          <View className="h-4" />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle"
          title="Não foi possível carregar"
          message={dataErrorMessage(error)}
          actionLabel="Tentar de novo"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
          renderItem={({ item }) => <ReminderRow reminder={item} onPress={() => router.push(`/lembrete/${item.id}`)} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title={EMPTY[tab].title}
              message={EMPTY[tab].message}
              actionLabel={all.length === 0 ? 'Novo lembrete' : undefined}
              onAction={all.length === 0 ? () => router.push('/lembrete/form') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
