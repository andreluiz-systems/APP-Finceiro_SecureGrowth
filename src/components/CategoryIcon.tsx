import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Nome de ícone seguro: se o nome salvo não existir, usa um ícone padrão. */
export function safeIcon(name: string | null | undefined, fallback: IconName = 'tag-outline'): IconName {
  return name && name in MaterialCommunityIcons.glyphMap ? (name as IconName) : fallback;
}

type Props = {
  name: string | null | undefined;
  size?: number;
  /** "glass" é o círculo translúcido usado sobre os cartões roxos escuros */
  variant?: 'soft' | 'glass';
};

/** Círculo com o ícone da categoria. */
export function CategoryIcon({ name, size = 44, variant = 'soft' }: Props) {
  const { colors } = useTheme();
  const glass = variant === 'glass';
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center ${glass ? 'bg-white/20' : 'bg-soft'}`}>
      <MaterialCommunityIcons name={safeIcon(name)} size={Math.round(size * 0.5)} color={glass ? '#FFFFFF' : colors.primary} />
    </View>
  );
}
