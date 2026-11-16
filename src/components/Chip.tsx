import { Pressable } from 'react-native';

import { AppText } from './AppText';

type Props = { label: string; selected?: boolean; onPress: () => void; className?: string };

export function Chip({ label, selected, onPress, className = '' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      className={`h-9 items-center justify-center rounded-full px-5 active:opacity-80 ${
        selected ? 'bg-primary' : 'bg-soft'
      } ${className}`}>
      <AppText weight="medium" tone={selected ? 'white' : 'primary'} className="text-xs">
        {label}
      </AppText>
    </Pressable>
  );
}
