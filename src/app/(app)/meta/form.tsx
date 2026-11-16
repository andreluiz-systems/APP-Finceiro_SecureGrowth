import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Switch, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { safeIcon } from '@/components/CategoryIcon';
import { CurrencyInput } from '@/components/CurrencyInput';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGoals, useSaveGoal } from '@/hooks/useGoals';
import { useTheme } from '@/hooks/useTheme';
import { dataErrorMessage } from '@/lib/errors';
import { GOAL_ICONS } from '@/lib/goalIcons';
import { parseDueDate, toDueDate } from '@/lib/reminders';

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

/** Nova meta. Com ?id=... vira "Editar meta". */
export default function MetaForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: goals, isLoading: loadingList } = useGoals();
  const save = useSaveGoal();

  const editing = !!id;
  const existing = id ? goals?.find((g) => g.id === id) : undefined;

  const [name, setName] = useState('');
  const [targetCents, setTargetCents] = useState(0);
  const [savedCents, setSavedCents] = useState(0);
  const [icon, setIcon] = useState<string>(GOAL_ICONS[0]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 6, d.getDate());
  });
  const [ready, setReady] = useState(!editing);
  const [errors, setErrors] = useState<{ name?: string; target?: string; form?: string }>({});

  useEffect(() => {
    if (ready || !existing) return;
    setName(existing.name);
    setTargetCents(Math.round(existing.target_amount * 100));
    setIcon(existing.icon);
    if (existing.deadline) {
      setHasDeadline(true);
      setDeadline(parseDueDate(existing.deadline));
    }
    setReady(true);
  }, [ready, existing]);

  async function handleSave() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Dê um nome para a meta.';
    if (targetCents <= 0) next.target = 'Informe o valor da meta.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await save.mutateAsync({
        id,
        name: name.trim(),
        target_amount: targetCents / 100,
        // o valor já guardado só entra na criação; depois ele muda pelo botão "Adicionar valor"
        ...(editing ? {} : { saved_amount: savedCents / 100 }),
        deadline: hasDeadline ? toDueDate(deadline) : null,
        icon,
      });
      router.back();
    } catch (error) {
      setErrors({ form: dataErrorMessage(error) });
    }
  }

  if (editing && !existing && !ready) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Editar meta" />
        {loadingList ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" title="Meta não encontrada" actionLabel="Voltar" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={editing ? 'Editar meta' : 'Nova meta'} />

      <View className={`rounded-3xl bg-field px-5 pb-4 pt-3 ${errors.target ? 'border border-danger' : ''}`}>
        <AppText weight="semibold" tone="muted" className="text-xs">
          valor da meta
        </AppText>
        <CurrencyInput cents={targetCents} onChange={setTargetCents} />
      </View>
      {errors.target ? (
        <AppText tone="danger" className="ml-1 mt-1 text-xs">
          {errors.target}
        </AppText>
      ) : null}

      <Field label="nome da meta">
        <View className={`rounded-2xl bg-field px-4 ${errors.name ? 'border border-danger' : ''}`}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex: viagem, notebook, reserva..."
            placeholderTextColor={colors.muted}
            maxLength={40}
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

      <Field label="ícone">
        <View className="flex-row flex-wrap gap-2.5 rounded-2xl bg-field p-3">
          {GOAL_ICONS.map((name) => {
            const selected = icon === name;
            return (
              <Pressable
                key={name}
                onPress={() => setIcon(name)}
                accessibilityRole="button"
                accessibilityLabel={`Ícone ${name}`}
                accessibilityState={{ selected }}
                className={`h-12 w-12 items-center justify-center rounded-full ${selected ? 'bg-primary' : 'bg-soft'}`}>
                <MaterialCommunityIcons name={safeIcon(name, 'flag-outline')} size={24} color={selected ? '#FFFFFF' : colors.primary} />
              </Pressable>
            );
          })}
        </View>
      </Field>

      {!editing ? (
        <Field label="já guardado (opcional)">
          <View className="rounded-2xl bg-field px-4 py-2">
            <CurrencyInput cents={savedCents} onChange={setSavedCents} />
          </View>
        </Field>
      ) : null}

      <View className="mt-4 flex-row items-center rounded-2xl bg-field px-4 py-3">
        <View className="flex-1 pr-3">
          <AppText weight="semibold" className="text-sm">
            Definir prazo
          </AppText>
          <AppText tone="muted" className="mt-0.5 text-xs">
            Mostramos quanto guardar por mês para chegar lá.
          </AppText>
        </View>
        <Switch
          value={hasDeadline}
          onValueChange={setHasDeadline}
          accessibilityLabel="Definir prazo"
          trackColor={{ false: colors.line, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
      {hasDeadline ? (
        <Field label="prazo">
          <DateField value={deadline} onChange={setDeadline} />
        </Field>
      ) : null}

      {errors.form ? (
        <AppText tone="danger" className="mt-4 text-center text-sm">
          {errors.form}
        </AppText>
      ) : null}

      <Button title="Confirmar" className="mt-8" loading={save.isPending} onPress={handleSave} />
    </Screen>
  );
}
