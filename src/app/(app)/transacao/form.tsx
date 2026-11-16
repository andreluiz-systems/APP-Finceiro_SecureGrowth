import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

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
import { useTheme } from '@/hooks/useTheme';
import { useSaveTransaction, useTransactions } from '@/hooks/useTransactions';
import { dataErrorMessage } from '@/lib/errors';
import type { Category, CategoryRef, TransactionType } from '@/types/database';

const matchesType = (kind: Category['kind'], type: TransactionType) => kind === 'both' || kind === type;

/** Categoria sugerida quando o usuário ainda não escolheu (como "alimentação" no Figma). */
function defaultCategory(categories: Category[], type: TransactionType): Category | undefined {
  const preferred = type === 'expense' ? 'Alimentação' : 'Salário';
  const ofType = categories.filter((c) => matchesType(c.kind, type));
  return ofType.find((c) => c.name === preferred) ?? ofType[0];
}

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

/** Adicionar transação. Com ?id=... vira "Editar transação". */
export default function TransacaoForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: transactions, isLoading: loadingList } = useTransactions();
  const { data: categories = [] } = useCategories();
  const save = useSaveTransaction();

  const editing = !!id;
  const existing = id ? transactions?.find((t) => t.id === id) : undefined;

  const [type, setType] = useState<TransactionType>('expense');
  const [cents, setCents] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryRef | null>(null);
  const [date, setDate] = useState(() => new Date());
  const [notes, setNotes] = useState('');
  const [ready, setReady] = useState(!editing);
  const [errors, setErrors] = useState<{ amount?: string; description?: string; form?: string }>({});

  // Edição: preenche o formulário com a transação existente (uma vez).
  useEffect(() => {
    if (ready || !existing) return;
    setType(existing.type);
    setCents(Math.round(existing.amount * 100));
    setDescription(existing.description);
    setCategory(existing.category);
    setDate(new Date(existing.occurred_at));
    setNotes(existing.notes ?? '');
    setReady(true);
  }, [ready, existing]);

  // Garante uma categoria compatível com o tipo (saída/entrada).
  useEffect(() => {
    if (!ready) return;
    if (category && matchesType(category.kind, type)) return;
    setCategory(defaultCategory(categories, type) ?? null);
  }, [ready, categories, type, category]);

  const picker = useCategoryPicker('transacao', (picked) => {
    setCategory(picked);
    if (picked.kind !== 'both') setType(picked.kind);
  });

  async function handleSave() {
    const next: typeof errors = {};
    if (cents <= 0) next.amount = 'Informe um valor maior que zero.';
    if (!description.trim()) next.description = 'Informe uma descrição.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await save.mutateAsync({
        id,
        type,
        amount: cents / 100,
        description: description.trim(),
        category_id: category?.id ?? null,
        occurred_at: date.toISOString(),
        notes: notes.trim() || null,
      });
      router.back();
    } catch (error) {
      setErrors({ form: dataErrorMessage(error) });
    }
  }

  if (editing && !existing && !ready) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Editar transação" />
        {loadingList ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" title="Transação não encontrada" actionLabel="Voltar" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={editing ? 'Editar transação' : 'Adicionar transação'} />

      <View className={`rounded-3xl bg-field px-5 pb-4 pt-3 ${errors.amount ? 'border border-danger' : ''}`}>
        <View className="flex-row items-center justify-between">
          <AppText weight="semibold" tone="muted" className="text-xs">
            valor
          </AppText>
          <View className="flex-row gap-1.5">
            {(['expense', 'income'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: type === t }}
                className={`rounded-full px-4 py-1.5 ${type === t ? 'bg-primary' : 'bg-card'}`}>
                <AppText weight="medium" tone={type === t ? 'white' : 'muted'} className="text-xs">
                  {t === 'expense' ? 'saída' : 'entrada'}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
        <CurrencyInput cents={cents} onChange={setCents} />
      </View>
      {errors.amount ? (
        <AppText tone="danger" className="ml-1 mt-1 text-xs">
          {errors.amount}
        </AppText>
      ) : null}

      <Field label="descrição">
        <View className={`rounded-2xl bg-field px-4 ${errors.description ? 'border border-danger' : ''}`}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="ex: mercado, salário..."
            placeholderTextColor={colors.muted}
            maxLength={80}
            returnKeyType="done"
            className="h-14 font-inter-medium text-sm text-ink"
          />
        </View>
        {errors.description ? (
          <AppText tone="danger" className="ml-1 mt-1 text-xs">
            {errors.description}
          </AppText>
        ) : null}
      </Field>

      <Field label="categoria">
        <Pressable
          onPress={() => picker.open({ kind: type, selectedId: category?.id })}
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

      <Field label="data">
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label="observação (opcional)">
        <View className="rounded-2xl bg-field px-4 py-3">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="observação (opcional)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={200}
            textAlignVertical="top"
            className="min-h-[56px] font-inter-medium text-sm text-ink"
          />
        </View>
      </Field>

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Confirmar" className="mt-8" loading={save.isPending} onPress={handleSave} />
    </Screen>
  );
}
