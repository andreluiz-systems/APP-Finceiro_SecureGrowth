import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { isGoalReached } from '@/lib/goals';
import { sumAmount } from '@/lib/reminders';
import { useUiStore } from '@/store/ui';

const HIDDEN = 'R$ ••••';

export default function Metas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const hide = useUiStore((s) => s.hideBalance);
  const { data, isLoading, isError, error, refetch, isRefetching } = useGoals();

  const goals = data ?? [];
  const saved = useMemo(() => sumAmount(goals.map((g) => ({ amount: g.saved_amount }))), [goals]);
  const reached = goals.filter(isGoalReached).length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <View className="px-5">
        <AppText weight="bold" className="mt-6 text-2xl">
          Metas
        </AppText>
        {goals.length > 0 ? (
          <View className="mb-3 mt-4 flex-row items-center rounded-2xl bg-field px-4 py-3">
            <View className="flex-1">
              <AppText tone="muted" weight="medium" className="text-xs">
                Total guardado
              </AppText>
              <AppText weight="bold" className="text-xl">
                {hide ? HIDDEN : formatCurrency(saved)}
              </AppText>
            </View>
            <AppText tone="primary" weight="semibold" className="text-xs">
              {reached} de {goals.length} {goals.length === 1 ? 'alcançada' : 'alcançadas'}
            </AppText>
          </View>
        ) : null}
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
          data={goals}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, paddingTop: 8, flexGrow: 1, gap: 12 }}
          renderItem={({ item }) => <GoalCard goal={item} onPress={() => router.push(`/meta/${item.id}`)} />}
          ListEmptyComponent={
            <EmptyState
              icon="flag"
              title="Você ainda não tem metas"
              message="Defina quanto quer juntar e acompanhe o seu progresso."
              actionLabel="Criar primeira meta"
              onAction={() => router.push('/meta/form')}
            />
          }
        />
      )}

      <Pressable
        onPress={() => router.push('/meta/form')}
        accessibilityRole="button"
        accessibilityLabel="Nova meta"
        style={{ position: 'absolute', right: 20, bottom: Math.max(insets.bottom, 12) + 84 }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80">
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
