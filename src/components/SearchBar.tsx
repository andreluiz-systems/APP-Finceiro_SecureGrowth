import { Feather } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type Props = { value: string; onChangeText: (text: string) => void; placeholder?: string };

export function SearchBar({ value, onChangeText, placeholder = 'Buscar' }: Props) {
  const { colors } = useTheme();
  return (
    <View className="h-12 flex-row items-center rounded-2xl bg-field px-4">
      <Feather name="search" size={20} color={colors.primary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="ml-3 flex-1 font-inter text-sm text-ink"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Limpar busca">
          <Feather name="x" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
