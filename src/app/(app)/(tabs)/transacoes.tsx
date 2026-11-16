import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, SectionList, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { ThemedModalContent } from '@/components/ThemedModalContent';
import { TransactionRow } from '@/components/TransactionRow';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { dataErrorMessage } from '@/lib/errors';
import { dayLabel } from '@/lib/format';
import { filterTransactions, groupByDay, type Period } from '@/lib/summary';

type TypeFilter = 'all' | 'income' | 'expense';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
];

export default function Transacoes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useTransactions();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const all = data ?? [];

  const sections = useMemo(() => {
    const filtered = filterTransactions(all, { query, type, period });
    return groupByDay(filtered).map((g) => ({
      key: g.key,
      title: dayLabel(g.date),
      data: g.data,
    }));
  }, [all, query, type, period]);

  const hasFilter = !!query || type !== 'all' || period !== 'all';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <View className="px-5">
        <AppText weight="bold" className="mt-6 text-2xl">
          Transações
        </AppText>
        <View className="mt-5">
          <SearchBar value={query} onChangeText={setQuery} placeholder="buscar transação" />
        </View>
        <View className="mb-1 mt-4 flex-row items-center gap-2">
          <Chip label="todas" selected={type === 'all'} onPress={() => setType('all')} />
          <Chip label="receitas" selected={type === 'income'} onPress={() => setType('income')} />
          <Chip label="despesas" selected={type === 'expense'} onPress={() => setType('expense')} />
          <View className="flex-1" />
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtrar por período"
            className="h-9 w-12 items-center justify-center rounded-full bg-soft active:opacity-70">
            <Feather name="sliders" size={18} color={colors.primary} />
            {period !== 'all' ? <View className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" /> : null}
          </Pressable>
        </View>
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
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 160,
            flexGrow: 1,
          }}
          renderSectionHeader={({ section }) => (
            <AppText weight="medium" tone="muted" className="mb-1 mt-4 text-xs uppercase">
              {section.title}
            </AppText>
          )}
          renderItem={({ item }) => <TransactionRow tx={item} onPress={() => router.push(`/transacao/${item.id}`)} />}
          ListEmptyComponent={
            hasFilter ? (
              <EmptyState icon="search" title="Nada encontrado" message="Mude a busca ou os filtros." />
            ) : (
              <EmptyState
                icon="inbox"
                title="Nenhuma transação ainda"
                message="Registre seus gastos e receitas para acompanhar o seu saldo."
                actionLabel="Adicionar transação"
                onAction={() => router.push('/transacao/form')}
              />
            )
          }
        />
      )}

      <Pressable
        onPress={() => router.push('/transacao/form')}
        accessibilityRole="button"
        accessibilityLabel="Adicionar transação"
        style={{
          position: 'absolute',
          right: 20,
          bottom: Math.max(insets.bottom, 12) + 84,
        }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80">
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <ThemedModalContent>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setFilterOpen(false)}>
            <Pressable className="rounded-t-3xl bg-card px-5 pb-10 pt-5" onPress={() => {}}>
              <AppText weight="bold" className="mb-2 text-base">
                Período
              </AppText>
              {PERIODS.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => {
                    setPeriod(p.value);
                    setFilterOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: period === p.value }}
                  className="h-12 flex-row items-center justify-between border-b border-line">
                  <AppText
                    weight={period === p.value ? 'bold' : 'regular'}
                    tone={period === p.value ? 'primary' : 'ink'}>
                    {p.label}
                  </AppText>
                  {period === p.value ? <Feather name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </ThemedModalContent>
      </Modal>
    </SafeAreaView>
  );
}
