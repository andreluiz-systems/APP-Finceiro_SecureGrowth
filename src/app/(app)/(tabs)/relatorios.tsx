import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BarChart } from '@/components/BarChart';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TransactionRow } from '@/components/TransactionRow';
import { chartColors, gradients } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { dataErrorMessage } from '@/lib/errors';
import { exportReportPdf, exportReportXlsx } from '@/lib/exportFiles';
import { formatCurrency, formatCurrencyShort, monthLong, monthShort } from '@/lib/format';
import { periodTitle } from '@/lib/reportHtml';
import {
  buildReportData,
  categoryBreakdown,
  dailyAverage,
  monthSummary,
  percentChange,
  sameMonth,
  shiftMonth,
  topTransactions,
  txOfMonth,
} from '@/lib/report';
import { monthlySeries } from '@/lib/summary';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const HIDDEN = 'R$ ••••••';

const pct = (v: number) => `${Math.abs(v).toFixed(1).replace('.', ',')}%`;

function SectionTitle({ title }: { title: string }) {
  return (
    <AppText weight="bold" className="mb-3 mt-7 text-xl">
      {title}
    </AppText>
  );
}

/** Pequeno cartão de número (média por dia, nº de transações...). */
function StatTile({ label, value, hint, hintTone }: { label: string; value: string; hint?: string; hintTone?: 'success' | 'danger' | 'muted' }) {
  return (
    <View className="flex-1 rounded-2xl bg-field px-3 py-3">
      <AppText tone="muted" weight="medium" className="text-[11px]" numberOfLines={1}>
        {label}
      </AppText>
      <AppText weight="bold" className="mt-1 text-base" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {hint ? (
        <AppText tone={hintTone ?? 'muted'} weight="semibold" className="mt-0.5 text-[11px]" numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export default function Relatorios() {
  const router = useRouter();
  const { colors } = useTheme();
  const hide = useUiStore((s) => s.hideBalance);
  const user = useAuthStore((s) => s.session?.user);
  const profile = useProfile();
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, isError, error, refetch, isRefetching } = useTransactions();

  const today = new Date();
  const [ref, setRef] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [kind, setKind] = useState<'expense' | 'income'>('expense');

  const isCurrent = sameMonth(ref, { year: today.getFullYear(), month: today.getMonth() });
  const prevRef = shiftMonth(ref.year, ref.month, -1);

  const all = data ?? [];
  const monthTx = useMemo(() => txOfMonth(all, ref.year, ref.month), [all, ref]);
  const summary = useMemo(() => monthSummary(monthTx), [monthTx]);
  const prevSummary = useMemo(() => monthSummary(txOfMonth(all, prevRef.year, prevRef.month)), [all, prevRef.year, prevRef.month]);
  const series = useMemo(() => monthlySeries(all, 6, new Date(ref.year, ref.month, 1)), [all, ref]);
  const slices = useMemo(() => categoryBreakdown(monthTx, kind, 6), [monthTx, kind]);
  const biggest = useMemo(() => topTransactions(monthTx, 'expense', 3), [monthTx]);

  const money = (v: number) => (hide ? HIDDEN : formatCurrency(v));
  const expenseChange = percentChange(summary.expense, prevSummary.expense);
  const resultChange = percentChange(summary.balance, prevSummary.balance);
  const hasData = monthTx.length > 0;

  async function runExport(format: 'pdf' | 'xlsx') {
    setExporting(true);
    try {
      const report = buildReportData(all, ref.year, ref.month);
      const meta = {
        userName: profile.data?.full_name || (user?.user_metadata?.full_name as string | undefined) || 'Usuário',
        userEmail: user?.email ?? '',
        generatedAt: new Date(),
      };
      if (format === 'pdf') await exportReportPdf(report, meta);
      else await exportReportXlsx(report, meta);
    } catch (error) {
      console.warn('[exportar]', error);
      Alert.alert('Não foi possível exportar', 'Tente novamente. Se continuar, reinicie o app.');
    } finally {
      setExporting(false);
    }
  }

  function handleExport() {
    if (monthTx.length === 0) {
      Alert.alert('Nada para exportar', `Não há transações em ${monthLong(ref.month)} de ${ref.year}.`);
      return;
    }
    Alert.alert('Exportar relatório', periodTitle(ref.year, ref.month), [
      { text: 'PDF', onPress: () => void runExport('pdf') },
      { text: 'Excel (.xlsx)', onPress: () => void runExport('xlsx') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function goMonth(delta: number) {
    setRef((r) => shiftMonth(r.year, r.month, delta));
  }

  return (
    <Screen
      tabBarSpace
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}>
      <View className="mt-6 flex-row items-center justify-between">
        <AppText weight="bold" className="text-2xl">
          Relatórios
        </AppText>
        <Pressable
          onPress={handleExport}
          disabled={exporting || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Exportar relatório"
          className={`h-10 flex-row items-center gap-1.5 rounded-full bg-soft px-4 active:opacity-70 ${exporting || isLoading ? 'opacity-60' : ''}`}>
          {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="download" size={16} color={colors.primary} />}
          <AppText weight="semibold" tone="primary" className="text-xs">
            {exporting ? 'Gerando...' : 'Exportar'}
          </AppText>
        </Pressable>
      </View>

      {/* Seletor de mês */}
      <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-field px-2 py-1.5">
        <Pressable
          onPress={() => goMonth(-1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60">
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </Pressable>
        <View className="items-center">
          <AppText weight="bold" className="text-base capitalize">
            {monthLong(ref.month)} {ref.year}
          </AppText>
          {!isCurrent ? (
            <Pressable onPress={() => setRef({ year: today.getFullYear(), month: today.getMonth() })} hitSlop={6}>
              <AppText tone="primary" weight="semibold" className="text-[11px]">
                voltar para o mês atual
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => goMonth(1)}
          disabled={isCurrent}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          accessibilityState={{ disabled: isCurrent }}
          className={`h-10 w-10 items-center justify-center rounded-full active:opacity-60 ${isCurrent ? 'opacity-30' : ''}`}>
          <Feather name="chevron-right" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="items-center py-20">
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
        <>
          {/* Resumo do mês */}
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20, marginTop: 16 }}>
            <AppText tone="white" className="text-sm opacity-80">
              Resultado de {monthLong(ref.month)}
            </AppText>
            <AppText weight="bold" tone="white" className="mt-1 text-4xl" numberOfLines={1} adjustsFontSizeToFit>
              {money(summary.balance)}
            </AppText>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 flex-row items-center rounded-2xl bg-white/20 p-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                  <Feather name="arrow-up" size={18} color="#FFFFFF" />
                </View>
                <View className="ml-2 flex-1">
                  <AppText tone="white" className="text-[11px] opacity-80">
                    Receitas
                  </AppText>
                  <AppText weight="bold" tone="white" className="text-xs" numberOfLines={1} adjustsFontSizeToFit>
                    {money(summary.income)}
                  </AppText>
                </View>
              </View>
              <View className="flex-1 flex-row items-center rounded-2xl bg-white/20 p-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                  <Feather name="arrow-down" size={18} color="#FFFFFF" />
                </View>
                <View className="ml-2 flex-1">
                  <AppText tone="white" className="text-[11px] opacity-80">
                    Despesas
                  </AppText>
                  <AppText weight="bold" tone="white" className="text-xs" numberOfLines={1} adjustsFontSizeToFit>
                    {money(summary.expense)}
                  </AppText>
                </View>
              </View>
            </View>
            <AppText tone="white" className="mt-3 text-[11px] opacity-80">
              {summary.savingsRate === null
                ? 'Sem receitas neste mês.'
                : summary.savingsRate >= 0
                  ? `Você guardou ${pct(summary.savingsRate * 100)} do que recebeu.`
                  : `Você gastou ${pct(Math.abs(summary.savingsRate) * 100)} a mais do que recebeu.`}
            </AppText>
          </LinearGradient>

          <View className="mt-3 flex-row gap-3">
            <StatTile label="Média por dia" value={hide ? HIDDEN : formatCurrency(dailyAverage(summary.expense, ref.year, ref.month))} hint="em despesas" />
            <StatTile label="Transações" value={String(summary.count)} hint="no mês" />
            <StatTile
              label="vs. mês anterior"
              value={expenseChange === null ? '—' : `${expenseChange > 0 ? '+' : expenseChange < 0 ? '-' : ''}${pct(expenseChange)}`}
              hint={expenseChange === null ? 'sem base' : expenseChange > 0 ? 'gastou mais' : expenseChange < 0 ? 'gastou menos' : 'igual'}
              hintTone={expenseChange === null || expenseChange === 0 ? 'muted' : expenseChange > 0 ? 'danger' : 'success'}
            />
          </View>

          {/* Gráfico dos últimos 6 meses */}
          <SectionTitle title="Receitas x despesas" />
          <LinearGradient colors={gradients.panel} style={{ borderRadius: 24, padding: 18 }}>
            <View className="flex-row items-start justify-between">
              <View>
                <AppText tone="white" className="text-[11px] opacity-70">
                  últimos 6 meses até {monthShort(ref.month)}
                </AppText>
                <AppText weight="bold" tone="white" className="mt-0.5 text-2xl">
                  {hide ? HIDDEN : formatCurrencyShort(series.reduce((s, p) => s + p.income - p.expense, 0))}
                </AppText>
              </View>
              {resultChange !== null && Math.abs(resultChange) >= 0.05 ? (
                <View className={`rounded-lg px-2 py-1 ${resultChange >= 0 ? 'bg-emerald-400/25' : 'bg-red-400/25'}`}>
                  <AppText weight="semibold" className="text-xs" style={{ color: resultChange >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                    {resultChange >= 0 ? '↑' : '↓'} {pct(resultChange)}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View className="mt-3">
              <BarChart data={series.map((p) => ({ label: monthShort(p.month), income: p.income, expense: p.expense }))} />
            </View>
            <View className="mt-2 flex-row justify-center gap-8">
              {[
                { label: 'Receitas', color: chartColors.income },
                { label: 'Despesas', color: chartColors.expense },
              ].map((l) => (
                <View key={l.label} className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <AppText weight="medium" tone="white" className="text-xs opacity-80">
                    {l.label}
                  </AppText>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Por categoria */}
          <SectionTitle title="Por categoria" />
          <View className="mb-3 flex-row gap-2">
            <Chip label="despesas" selected={kind === 'expense'} onPress={() => setKind('expense')} />
            <Chip label="receitas" selected={kind === 'income'} onPress={() => setKind('income')} />
          </View>
          {slices.length === 0 ? (
            <View className="items-center rounded-3xl bg-field px-5 py-8">
              <AppText weight="semibold" className="text-sm">
                {hasData ? `Nenhuma ${kind === 'expense' ? 'despesa' : 'receita'} neste mês` : 'Nenhuma transação neste mês'}
              </AppText>
              {!hasData && isCurrent ? (
                <Pressable onPress={() => router.push('/transacao/form')} hitSlop={8}>
                  <AppText tone="primary" weight="semibold" className="mt-1 text-xs">
                    Adicionar transação
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="rounded-3xl bg-field px-4 py-2">
              {slices.map((s, i) => (
                <View key={s.key} className={`py-3 ${i < slices.length - 1 ? 'border-b border-line' : ''}`}>
                  <View className="flex-row items-center">
                    <CategoryIcon name={s.icon} size={38} />
                    <View className="ml-3 flex-1">
                      <AppText weight="semibold" className="text-sm" numberOfLines={1}>
                        {s.name}
                      </AppText>
                      <AppText tone="muted" className="text-[11px]">
                        {s.count} {s.count === 1 ? 'transação' : 'transações'}
                      </AppText>
                    </View>
                    <View className="items-end">
                      <AppText weight="bold" className="text-sm">
                        {money(s.total)}
                      </AppText>
                      <AppText tone="muted" weight="medium" className="text-[11px]">
                        {Math.round(s.share * 100)}%
                      </AppText>
                    </View>
                  </View>
                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                    <View
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max(2, Math.round(s.share * 100))}%`,
                        backgroundColor: kind === 'expense' ? chartColors.expense : chartColors.income,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Maiores gastos */}
          {biggest.length > 0 ? (
            <>
              <SectionTitle title="Maiores gastos" />
              <View className="rounded-3xl bg-field px-4 py-1">
                {biggest.map((t) => (
                  <TransactionRow key={t.id} tx={t} onPress={() => router.push(`/transacao/${t.id}`)} />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
