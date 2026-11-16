import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Switch, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CurrencyInput } from '@/components/CurrencyInput';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryPicker } from '@/hooks/useCategoryPicker';
import { useReminders, useSaveReminder } from '@/hooks/useReminders';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { ensureNotificationPermission } from '@/lib/reminderNotifications';
import { NOTIFY_DAYS_BEFORE, parseDueDate, toDueDate } from '@/lib/reminders';
import type { CategoryRef } from '@/types/database';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mt-4">
      <AppText weight="semibold" tone="muted" className="mb-1.5 ml-1 text-xs">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function ToggleRow({ title, hint, value, onChange }: { title: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View className="mt-3 flex-row items-center rounded-2xl bg-field px-4 py-3">
      <View className="flex-1 pr-3">
        <AppText weight="semibold" className="text-sm">
          {title}
        </AppText>
        <AppText tone="muted" className="mt-0.5 text-xs">
          {hint}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ false: colors.line, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

/** Novo lembrete. Com ?id=... vira "Editar lembrete". */
export default function LembreteForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: reminders, isLoading: loadingList } = useReminders();
  const { data: categories = [] } = useCategories();
  const save = useSaveReminder();

  const editing = !!id;
  const existing = id ? reminders?.find((r) => r.id === id) : undefined;

  const [name, setName] = useState('');
  const [cents, setCents] = useState(0);
  const [category, setCategory] = useState<CategoryRef | null>(null);
  const [due, setDue] = useState(() => new Date());
  const [repeat, setRepeat] = useState(false);
  const [notify, setNotify] = useState(true);
  const [ready, setReady] = useState(!editing);
  const [errors, setErrors] = useState<{ amount?: string; name?: string; form?: string }>({});

  useEffect(() => {
    if (ready || !existing) return;
    setName(existing.name);
    setCents(Math.round(existing.amount * 100));
    setCategory(existing.category);
    setDue(parseDueDate(existing.due_date));
    setRepeat(existing.repeat_monthly);
    setNotify(existing.notify_before);
    setReady(true);
  }, [ready, existing]);

  // Sugere a categoria "Contas fixas" (ou a primeira de despesa) quando o usuário ainda não escolheu.
  useEffect(() => {
    if (!ready || category) return;
    const expense = categories.filter((c) => c.kind !== 'income');
    setCategory(expense.find((c) => c.name === 'Contas fixas') ?? expense[0] ?? null);
  }, [ready, categories, category]);

  const picker = useCategoryPicker('lembrete', setCategory);

  async function handleSave() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Informe o nome da conta.';
    if (cents <= 0) next.amount = 'Informe um valor maior que zero.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      if (notify) await ensureNotificationPermission();
      await save.mutateAsync({
        id,
        name: name.trim(),
        amount: cents / 100,
        category_id: category?.id ?? null,
        due_date: toDueDate(due),
        repeat_monthly: repeat,
        notify_before: notify,
      });
      router.back();
    } catch (error) {
      setErrors({ form: dataErrorMessage(error) });
    }
  }

  if (editing && !existing && !ready) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Editar lembrete" />
        {loadingList ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" title="Lembrete não encontrado" actionLabel="Voltar" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={editing ? 'Editar lembrete' : 'Novo lembrete'} />

      <View className={`rounded-3xl bg-field px-5 pb-4 pt-3 ${errors.amount ? 'border border-danger' : ''}`}>
        <AppText weight="semibold" tone="muted" className="text-xs">
          valor da conta
        </AppText>
        <CurrencyInput cents={cents} onChange={setCents} />
      </View>
      {errors.amount ? (
        <AppText tone="danger" className="ml-1 mt-1 text-xs">
          {errors.amount}
        </AppText>
      ) : null}

      <Field label="nome">
        <View className={`rounded-2xl bg-field px-4 ${errors.name ? 'border border-danger' : ''}`}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex: aluguel, internet, cartão..."
            placeholderTextColor={colors.muted}
            maxLength={60}
            returnKeyType="done"
            className="h-14 font-inter-medium text-sm text-ink"
          />
        </View>
        {errors.name ? (
          <AppText tone="danger" className="ml-1 mt-1 text-xs">
            {errors.name}
          </AppText>
        ) : null}
      </Field>

      <Field label="categoria">
        <Pressable
          onPress={() => picker.open({ kind: 'expense', selectedId: category?.id })}
          accessibilityRole="button"
          accessibilityLabel="Escolher categoria"
          className="h-16 flex-row items-center rounded-2xl bg-field px-3 active:opacity-80">
          <CategoryIcon name={category?.icon} size={40} />
          <AppText weight="medium" className="ml-3 flex-1 text-base">
            {category?.name ?? 'Selecione'}
          </AppText>
          <Feather name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      </Field>

      <Field label="vencimento">
        <DateField value={due} onChange={setDue} />
      </Field>

      <ToggleRow
        title="Repetir todo mês"
        hint="Ao marcar como paga, o app já cria a do mês seguinte."
        value={repeat}
        onChange={setRepeat}
      />
      <ToggleRow
        title="Avisar antes de vencer"
        hint={`Notificação ${NOTIFY_DAYS_BEFORE} dias antes e no dia do vencimento.`}
        value={notify}
        onChange={setNotify}
      />

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Confirmar" className="mt-8" loading={save.isPending} onPress={handleSave} />
    </Screen>
  );
}
