import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BarChart } from '@/components/BarChart';
import { CategoryIcon } from '@/components/CategoryIcon';
import { GoalCard } from '@/components/GoalCard';
import { Screen } from '@/components/Screen';
import { TransactionRow } from '@/components/TransactionRow';
import { gradients } from '@/constants/theme';
import { useGoals } from '@/hooks/useGoals';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { useReminders } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { dataErrorMessage } from '@/lib/errors';
import { firstName, formatCurrency, formatCurrencyShort, greeting, monthLong, monthShort } from '@/lib/format';
import { overdueReminders } from '@/lib/reminders';
import { inMonth, monthChange, monthlySeries, totals } from '@/lib/summary';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const HIDDEN = 'R$ ••••••';

function SectionTitle({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View className="mb-3 mt-7 flex-row items-end justify-between">
      <AppText weight="bold" className="text-xl">
        {title}
      </AppText>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={10}>
          <AppText weight="semibold" tone="primary" className="text-sm">
            Ver todas
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function Inicio() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.session?.user);
  const profile = useProfile();
  const transactions = useTransactions();
  const goals = useGoals();
  const reminders = useReminders();
  const unread = useUnreadCount();
  const hasOverdue = overdueReminders(reminders.data ?? []).length > 0;
  const hide = useUiStore((s) => s.hideBalance);
  const toggleHide = useUiStore((s) => s.toggleHideBalance);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    useUiStore.getState().load();
  }, []);

  const list = transactions.data;
  const all = useMemo(() => totals(list ?? []), [list]);
  const month = useMemo(() => {
    const now = new Date();
    return totals(inMonth(list ?? [], now.getFullYear(), now.getMonth()));
  }, [list]);
  const series = useMemo(() => monthlySeries(list ?? [], 6), [list]);
  const change = useMemo(() => monthChange(series), [series]);
  const periodNet = series.reduce((sum, p) => sum + p.income - p.expense, 0);
  const chartData = series.map((p) => ({ label: monthShort(p.month), income: p.income, expense: p.expense }));

  const name = firstName(profile.data?.full_name || (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0]);
  const money = (value: number) => (hide ? HIDDEN : formatCurrency(value));

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([transactions.refetch(), goals.refetch(), reminders.refetch(), profile.refetch()]);
    setRefreshing(false);
  }

  const avatarUrl = profile.data?.avatar_url;

  return (
    <Screen
      tabBarSpace
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* Cabeçalho */}
      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-1">
          <AppText tone="muted" className="text-base">
            {greeting(new Date().getHours())},
          </AppText>
          <AppText weight="semibold" className="text-xl" numberOfLines={1}>
            {name || 'bem-vindo'} 👋
          </AppText>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push('/notificacoes')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            className="h-10 w-10 items-center justify-center">
            <Feather name="bell" size={24} color={colors.ink} />
            {unread > 0 ? <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-bg bg-primary" /> : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/lembretes')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Alertas e lembretes"
            className="h-10 w-10 items-center justify-center">
            <Feather name="calendar" size={24} color={colors.ink} />
            {hasOverdue ? <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-bg bg-danger" /> : null}
          </Pressable>
          <Pressable
            onPress={() => router.navigate('/perfil')}
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-soft bg-primary">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="h-full w-full" />
            ) : (
              <Feather name="user" size={22} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>

      {transactions.isError ? (
        <Pressable onPress={() => transactions.refetch()} className="mt-4 rounded-2xl bg-danger-soft px-4 py-3">
          <AppText tone="danger" weight="semibold" className="text-xs">
            {dataErrorMessage(transactions.error)} Toque para tentar de novo.
          </AppText>
        </Pressable>
      ) : null}

      {/* Saldo */}
      <LinearGradient
        colors={isDark ? gradients.heroDark : gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 22, marginTop: 20 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <AppText tone="white" className="text-base opacity-90">
              Saldo total
            </AppText>
            {transactions.isLoading ? (
              <ActivityIndicator color="#FFFFFF" style={{ alignSelf: 'flex-start', marginTop: 12 }} />
            ) : (
              <AppText weight="bold" tone="white" className="mt-1 text-4xl" numberOfLines={1} adjustsFontSizeToFit>
                {money(all.balance)}
              </AppText>
            )}
          </View>
          <Pressable
            onPress={toggleHide}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hide ? 'Mostrar valores' : 'Ocultar valores'}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <Feather name={hide ? 'eye-off' : 'eye'} size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="mt-5 flex-row gap-3">
          {(
            [
              { label: 'Receitas', value: month.income, icon: 'arrow-up' },
              { label: 'Despesas', value: month.expense, icon: 'arrow-down' },
            ] as const
          ).map((item) => (
            <View key={item.label} className="flex-1 flex-row items-center rounded-2xl bg-white/20 px-3 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                <Feather name={item.icon} size={18} color="#FFFFFF" />
              </View>
              <View className="ml-2 flex-1">
                <AppText tone="white" className="text-[11px] opacity-80" numberOfLines={1}>
                  {item.label}
                </AppText>
                <AppText weight="bold" tone="white" className="text-xs" numberOfLines={1} adjustsFontSizeToFit>
                  {money(item.value)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
        <AppText tone="white" className="mt-3 text-[11px] opacity-70">
          Receitas e despesas de {monthLong(new Date().getMonth())}
        </AppText>
      </LinearGradient>

      {/* Receitas x despesas */}
      <SectionTitle title="Receitas x despesas" />
      <LinearGradient colors={gradients.panel} style={{ borderRadius: 24, padding: 18 }}>
        <View className="flex-row items-start justify-between">
          <View>
            <AppText weight="bold" tone="white" className="text-3xl">
              {hide ? HIDDEN : formatCurrencyShort(periodNet)}
            </AppText>
            <AppText tone="white" className="text-[11px] opacity-70">
              resultado dos últimos 6 meses
            </AppText>
          </View>
          {change !== null ? (
            <View className={`rounded-lg px-2 py-1 ${change >= 0 ? 'bg-emerald-400/25' : 'bg-red-400/25'}`}>
              <AppText weight="semibold" className="text-xs" style={{ color: change >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1).replace('.', ',')}%
              </AppText>
            </View>
          ) : null}
        </View>
        <View className="mt-3">
          <BarChart data={chartData} />
        </View>
        <View className="mt-2 flex-row justify-center gap-8">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: '#48DD9F' }} />
            <AppText weight="medium" tone="white" className="text-xs opacity-80">
              Receitas
            </AppText>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: '#FF8186' }} />
            <AppText weight="medium" tone="white" className="text-xs opacity-80">
              Despesas
            </AppText>
          </View>
        </View>
      </LinearGradient>

      {/* Metas */}
      <SectionTitle title="Metas" onSeeAll={() => router.navigate('/metas')} />
      {goals.data && goals.data.length > 0 ? (
        <View className="gap-3">
          {goals.data.slice(0, 2).map((g) => (
            <GoalCard key={g.id} goal={g} onPress={() => router.push(`/meta/${g.id}`)} />
          ))}
        </View>
      ) : (
        <Pressable
          onPress={() => router.navigate('/metas')}
          className="items-center rounded-3xl border border-dashed border-primary/50 bg-field px-5 py-6 active:opacity-80">
          <AppText weight="semibold" className="text-sm">
            Você ainda não tem metas
          </AppText>
          <AppText tone="primary" weight="semibold" className="mt-1 text-xs">
            Toque para criar a primeira
          </AppText>
        </Pressable>
      )}

      {/* Últimas transações */}
      <SectionTitle title="Últimas transações" onSeeAll={() => router.navigate('/transacoes')} />
      {list && list.length > 0 ? (
        <LinearGradient colors={gradients.panel} style={{ borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6 }}>
          {list.slice(0, 4).map((t, i) => (
            <View key={t.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' } : undefined}>
              <TransactionRow tx={t} variant="panel" onPress={() => router.push(`/transacao/${t.id}`)} />
            </View>
          ))}
        </LinearGradient>
      ) : (
        <Pressable
          onPress={() => router.push('/transacao/form')}
          className="items-center rounded-3xl border border-dashed border-primary/50 bg-field px-5 py-6 active:opacity-80">
          <CategoryIcon name="cash-plus" size={44} />
          <AppText weight="semibold" className="mt-3 text-sm">
            Nenhuma transação ainda
          </AppText>
          <AppText tone="primary" weight="semibold" className="mt-1 text-xs">
            Toque para registrar a primeira
          </AppText>
        </Pressable>
      )}
    </Screen>
  );
}
