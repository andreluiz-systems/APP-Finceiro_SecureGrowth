import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/lib/format';

import { AppText } from './AppText';
import { ThemedModalContent } from './ThemedModalContent';

type Props = { value: Date; onChange: (date: Date) => void };

/** Troca só o dia, mantendo a hora que já estava. */
function keepTime(current: Date, picked: Date): Date {
  return new Date(
    picked.getFullYear(),
    picked.getMonth(),
    picked.getDate(),
    current.getHours(),
    current.getMinutes(),
    current.getSeconds(),
  );
}

/** Linha "data" do formulário. No Android abre o calendário; no iPhone abre uma folha com o seletor. */
export function DateField({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && picked) onChange(keepTime(value, picked));
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Escolher data"
        className="h-14 flex-row items-center justify-between rounded-2xl bg-field px-4 active:opacity-80">
        <AppText weight="semibold" tone="muted" className="text-sm">
          {formatDate(value)}
        </AppText>
        <Feather name="chevron-right" size={20} color={colors.muted} />
      </Pressable>

      {Platform.OS === 'android' && open ? <DateTimePicker value={value} mode="date" onChange={handleChange} /> : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <ThemedModalContent>
            <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
            <View className="bg-card px-5 pb-10 pt-4">
              <View className="mb-2 flex-row justify-end">
                <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                  <AppText tone="primary" weight="bold">
                    Concluir
                  </AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                locale="pt-BR"
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={handleChange}
              />
            </View>
          </ThemedModalContent>
        </Modal>
      ) : null}
    </>
  );
}
