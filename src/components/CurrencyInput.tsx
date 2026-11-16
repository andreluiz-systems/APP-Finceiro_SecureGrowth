import { TextInput } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { digitsToCents, formatCents } from '@/lib/format';

type Props = {
  /** valor em centavos */
  cents: number;
  onChange: (cents: number) => void;
};

/** Campo de valor: o usuário digita só números e o valor se forma da direita para a esquerda (1, 12, 125 -> R$ 1,25). */
export function CurrencyInput({ cents, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={formatCents(cents)}
      onChangeText={(text) => onChange(digitsToCents(text))}
      keyboardType="number-pad"
      selectionColor={colors.primary}
      accessibilityLabel="Valor"
      className="font-inter-bold text-3xl text-ink"
    />
  );
}
